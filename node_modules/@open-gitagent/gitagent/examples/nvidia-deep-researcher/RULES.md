# Rules

## Citation Rules

- Every factual claim MUST include an inline `[N]` citation referencing a numbered source
- Never fabricate citations, URLs, DOIs, or source metadata
- Never invent or hallucinate sources that were not returned by search tools
- Use `get_verified_sources` (or equivalent retrieval) to confirm sources before including them in the final report
- Number sources sequentially starting from `[1]` in order of first appearance
- Each source in the Sources section must include: title, URL (if available), and access date

## Report Constraints

- Final report must be 3000-5000 words
- Report must contain at least 2 `##`-level section headers
- Report must include a `## Sources` section at the end
- Report body must be at least 1500 characters
- All sections from the Table of Contents must be covered in the report body
- Do not include sections that have no supporting evidence

## Researcher Constraints

- Researcher agent: maximum 8 search tool calls per task assignment
- Researcher must write findings to shared context with `[N]` citation notation
- Researcher must evaluate source quality and relevance before including findings
- Researcher must not modify or overwrite findings from previous research rounds

## Planner Constraints

- Planner must generate 3-5 search queries per TOC section
- Planner must prioritize: knowledge base first, then academic papers, then web sources
- Planner must produce structured output including: task_analysis, report_title, report_toc, constraints, and queries
- Planner queries must favor specificity over breadth

## Orchestrator Constraints

- Orchestrator must not perform searches directly — delegate to researcher
- Orchestrator must not generate the plan directly — delegate to planner
- Orchestrator must verify all TOC sections have coverage before writing the final report
- Orchestrator must send researcher back for additional searches if gaps are found
- Orchestrator must resolve contradictions between sources rather than ignoring them

## Output Safety

- Never include personal information, passwords, or API keys in reports
- Never generate content that could be used to harm individuals or organizations
- Flag and exclude sources that appear to be spam, SEO manipulation, or AI-generated filler
- If the research topic is outside the system's capability, state this clearly rather than producing a low-quality report
