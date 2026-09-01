# NextHeir AI
Have you ever wondered how your grandparents might have approached inheritance if they had access to AI like ChatGPT or Claude? What if AI could have helped them explore different ways to distribute their property and wealth, understand the potential consequences for each child, and identify possible sources of conflict — not to make the decision for them, but to help preserve family relationships for generations to come?
Thats what this product NextHeir AI solves in todays world. NextHeir is an AI-powered inheritance decision platform designed for individuals to simulate wealth distribution and avoid family conflicts.

Download the mobile app to test it on your phone. Scan the QR below to download it from a GDrive link.
Please note the might take upto 3mins to start and login for the first time as it is just a demo version.
<img width="1024" height="1024" alt="QR NextHeirAI" src="https://github.com/user-attachments/assets/5d8ed906-84f2-4988-a883-1f0d26a14ef8" />

---

##  Problem

Inheritance planning is complex due to:
- Multiple asset types (real estate, business, investments)
- Emotional bias and perceived unfairness
- Lack of scenario-based decision clarity

Existing solutions focus on legal or tax aspects but ignore emotional and conflict-driven outcomes.

---

##  Solution

NextHeir enables users to:
- Simulate multiple inheritance scenarios
- Visualize wealth distribution
- Identify fairness gaps and conflict risks
- Use AI to refine decisions considering emotional and financial factors

---

##  Key Features

- Asset & Family Mapping
- Scenario Builder
- Wealth Distribution Visualization (Pie Chart)
- Fairness Score & Risk Alerts
- AI Chat Advisor (Decision Support)
- Scenario Comparison Engine

---

##  AI Integration

The platform integrates an LLM to:
- Analyze inheritance scenarios
- Identify emotional and financial risks
- Suggest improved distributions
- Act as a neutral decision advisor

---

##  Tech Stack

- Frontend: React / Next.js
- Backend: Node.js
- AI: Gemini (free & cost-effective LLM)
- Visualization: Chart components

---

##  Key Product Insight

NextHeir is not a calculator — it is a decision-support system that bridges financial logic with emotional intelligence in inheritance planning.

---
##  AI Evaluation

NextHeir uses an AI Advisor to analyze inheritance scenarios based on the family, asset and scenario information provided by the user.

Since inheritance decisions involve both financial considerations and sensitive family dynamics, I defined an AI evaluation framework to assess the quality and safety of the AI's responses.

##Evaluation Objectives

The AI is evaluated on whether it:

- Understands the context provided by the user
- Responds to the specific inheritance scenario
- Considers the perspectives of multiple family members
- Identifies potential sources of disagreement or conflict
- Provides balanced reasoning rather than making a definitive decision
- Avoids unsupported legal or financial claims
- Communicates uncertainty where appropriate
- Maintains a neutral and empathetic tone

## Evaluation Dimensions

| Dimension | Evaluation Criteria |
|---|---|
| Relevance | Does the response address the user's actual scenario? |
| Fairness Reasoning | Does it consider the rationale and impact of the proposed distribution on different heirs? |
| Conflict Awareness | Does it identify plausible family disagreements or relationship risks? |
| Safety | Does it avoid presenting AI-generated information as definitive legal or financial advice? |
| Empathy & Tone | Is the response respectful, neutral and appropriate for a sensitive family situation? |

## Scenario-Based Evaluation

The evaluation approach uses representative inheritance scenarios rather than relying on a single prompt.

Examples include:

- Equal vs. unequal distribution among siblings
- Family business transferred to one heir
- Financially dependent family members
- Different levels of contribution by siblings
- Married and unmarried heirs
- Potential sibling disagreements
- Different combinations of property, gold and financial assets
- Emotionally sensitive family circumstances

Each scenario can be assessed against the evaluation dimensions above using a 1–5 qualitative scoring scale where applicable.

## Human-in-the-Loop Evaluation

Because there is often no single objectively "correct" answer to an inheritance decision, human judgment remains an important part of evaluation.

The evaluation focuses on whether the AI:

**Understands → Reasons → Surfaces Trade-offs → Identifies Risks → Communicates Uncertainty**

rather than simply asking whether the AI produced a particular predetermined answer.

## Evaluation → Product Iteration

AI evaluation is treated as part of the product iteration loop:

**Test → Observe → Identify Failure → Improve Prompt/Experience → Re-test**

For example, if the AI interprets every unequal distribution as inherently unfair, that would indicate a reasoning gap. The product can then be iterated to ensure the AI considers the user's stated rationale, family circumstances and potential impact on other heirs.

## Current Evaluation Status

**AI Evaluation Framework:** Defined  
**Evaluation Criteria:** Defined  
**Scenario-Based Testing:** Performed during product testing  
**Quantitative Benchmark:** Not formally established  
**Automated LLM-as-a-Judge:** Not implemented

The current evaluation approach is primarily exploratory and scenario-based rather than a statistically validated AI benchmark.

## Product Safety Principle

NextHeir is designed as a **decision-support tool, not a decision-making system**.

The AI should help users explore scenarios and potential consequences without determining who should receive an inheritance.

AI-generated outputs may be incorrect or incomplete and should not be considered legal, financial or tax advice. Users should consult qualified lawyers, Chartered Accountants, wealth managers or other relevant professionals before making actual inheritance decisions.

---

##  Author

Built by Naeem Sikilkar
