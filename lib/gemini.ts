import { GoogleGenerativeAI } from '@google/generative-ai';
import { KPIData } from './kpiEngine';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type Insight = {
  icon: string;
  headline: string;
  cause: string;
  action: string;
};

export type InsightResponse = {
  insights: Insight[];
  recommendedCharts: string[];
};

function buildKPIContext(kpis: KPIData): string {
  return `
BUSINESS METRICS SNAPSHOT:
- Total Revenue: $${kpis.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
- Total Orders: ${kpis.totalOrders.toLocaleString()}
- Total Profit: $${kpis.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
- Profit Margin: ${kpis.profitMargin.toFixed(1)}%
- Average Order Value: $${kpis.avgOrderValue.toFixed(2)}
- Revenue Growth: ${kpis.growthRate.toFixed(1)}%

TOP 5 PRODUCTS BY REVENUE:
${kpis.topProducts.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}: $${p.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${p.quantity} units)`).join('\n')}

REGION PERFORMANCE:
${kpis.regionPerformance.map(r => `- ${r.region}: $${r.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${r.orders} orders)`).join('\n')}

TOP SALESPERSONS:
${kpis.salespersonPerformance.slice(0, 5).map((s, i) => `${i + 1}. ${s.name}: $${s.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`).join('\n')}

MONTHLY TREND (last 6 months):
${kpis.salesTrend.slice(-6).map(t => `- ${t.date}: Revenue $${t.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}, Profit $${t.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`).join('\n')}

ACTIVE ALERTS: ${kpis.alerts.map(a => a.message).join('; ') || 'None'}
`.trim();
}

export async function generateInsights(kpis: KPIData): Promise<InsightResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    });

    const context = buildKPIContext(kpis);
    const prompt = `You are an elite system that analyzes structured sales data, finds real patterns, identifies root causes, and produces decision-ready insights.
Your job is to extract what is NOT obvious and explain what actually matters.

${context}

## HARD CONSTRAINTS (VERY STRICT)
1. ❌ DO NOT generate generic statements (e.g., "growth is stable", "business is performing well").
2. ❌ DO NOT contradict yourself (e.g., "growth stable" + "revenue dropped").
3. ❌ DO NOT repeat dashboard metrics without analysis.
4. ❌ DO NOT give random recommendations.
5. ❌ DO NOT assume facts not supported by data.

## CORE ANALYSIS LOGIC
- TREND ANALYSIS: Detect major changes/spikes/drops (magnitude, direction, consistency).
- ROOT CAUSE ANALYSIS: For any major change, identify WHAT caused it (e.g., "Revenue dropped due to decline in order volume, not pricing").
- CONTRIBUTION ANALYSIS: Identify concentration risk (e.g., "40% of revenue from 1 product").
- ANOMALY DETECTION: Detect unusual behavior and explain why it's unusual.
- DATA QUALITY: Missing values/"Unknown" labels are insights (e.g., tracking issues).
- BUSINESS IMPACT: Why does this matter?
- ACTIONABLE RECOMMENDATION: What to do next.

## OUTPUT STRUCTURE (STRICT)
Return EXACTLY a JSON object with 3 to 5 insights and recommended charts.
The FIRST insight MUST be the MOST critical business issue.

Style: short, sharp, high-impact, no fluff, no filler words.

JSON Format:
{
  "insights": [
    {
      "icon": "🚨 for critical drop/risk, ⚠️ for warning/anomaly, 📈 for opportunity, or 🧹 for data issue",
      "headline": "1 line — what happened",
      "cause": "why it happened",
      "action": "what to do"
    }
  ],
  "recommendedCharts": ["trend", "products", "regions", "salespersons"] // omit irrelevant charts
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown fences if present
    const jsonStr = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    // Find the first { and last } to extract JSON robustly
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found in response');

    return JSON.parse(jsonStr.slice(start, end + 1));
  } catch (err) {
    console.error('Gemini insights error:', err);
    // Return meaningful fallback based on actual KPI data
    return {
      insights: [
        {
          icon: kpis.growthRate < 0 ? "🚨" : "📈",
          headline: `Revenue ${kpis.growthRate < 0 ? 'dropped' : 'grew'} by ${Math.abs(kpis.growthRate).toFixed(1)}% to $${(kpis.totalRevenue/1000).toFixed(1)}K`,
          cause: `${kpis.topProducts[0]?.name || 'Top products'} drove the majority of the volume change`,
          action: kpis.growthRate < 0 ? "Investigate demand drop immediately" : "Scale marketing for top products",
        },
        {
          icon: kpis.profitMargin < 20 ? "⚠️" : "📈",
          headline: `Profit margin sits at ${kpis.profitMargin.toFixed(1)}%`,
          cause: kpis.profitMargin < 20 ? "High operational costs compared to revenue" : "Healthy pricing and cost control",
          action: kpis.profitMargin < 20 ? "Review COGS and pricing strategy" : "Maintain current margin strategy",
        }
      ],
      recommendedCharts: ['trend', 'products', 'regions', 'salespersons']
    };
  }
}

export async function chatWithData(question: string, kpis: KPIData): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
    });

    const context = buildKPIContext(kpis);
    const prompt = `CORE IDENTITY
You are:
- A Senior Data Scientist specializing in Sales Analytics
- A Real-time Business Intelligence System
- A Data-first decision-making engine

You NEVER guess. You NEVER hallucinate.
You ONLY respond based on:
- Uploaded datasets
- Provided metrics
- Computed insights
- Derived statistical reasoning from data

PRIMARY RULE
If data is not present to answer the question, say exactly: "This insight is not available in the current dataset."

ANALYTICAL CAPABILITIES
- Revenue, profit, cost, orders, customers
- Sales drops, spikes, anomalies
- Trend analysis
- Region/product/customer performance
- Growth %, decline %, contribution %

RESPONSE STYLE
- Summary
- Key Insight
- Deep Analysis
- Anomalies
- Recommendation

RULES
- No hallucination
- No external assumptions
- Always data-backed
- Use numbers over opinions

GOAL
Help user understand: What happened, Why it happened, What to do next.

DATASET CONTEXT:
${context}

User query: "${question}"`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    const q = question.toLowerCase();
    
    let answer = `Based on your data: Revenue $${kpis.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}, ${kpis.totalOrders} orders, ${kpis.profitMargin.toFixed(1)}% margin. Top product: ${kpis.topProducts[0]?.name || 'N/A'}. Top region: ${kpis.regionPerformance[0]?.region || 'N/A'}.`;
    
    if (q.includes('top') && q.includes('sales')) {
      answer = `Your top salesperson is ${kpis.salespersonPerformance[0]?.name || 'N/A'} with $${kpis.salespersonPerformance[0]?.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} in revenue.`;
    } else if (q.includes('region')) {
      answer = `Your best region is ${kpis.regionPerformance[0]?.region || 'N/A'} with $${kpis.regionPerformance[0]?.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} revenue. Weakest: ${kpis.regionPerformance[kpis.regionPerformance.length - 1]?.region || 'N/A'}.`;
    } else if (q.includes('product')) {
      answer = `Top product is ${kpis.topProducts[0]?.name || 'N/A'} with $${kpis.topProducts[0]?.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} revenue and ${kpis.topProducts[0]?.quantity || 0} units sold.`;
    } else if (q.includes('profit') || q.includes('margin')) {
      answer = `Current profit margin is ${kpis.profitMargin.toFixed(1)}% on $${kpis.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} revenue, generating $${kpis.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })} profit.`;
    }

    return `Summary: Extracted specific data point based on your query.
Key Insight: ${answer}
Deep Analysis: No deeper analysis could be generated dynamically due to a connection issue.
Anomalies: None detected in this static fallback.
Recommendation: Verify API connection or try another query.`;
  }
}
