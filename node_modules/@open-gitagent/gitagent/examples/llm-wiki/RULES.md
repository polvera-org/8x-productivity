# Rules

## Must Always
- Read `memory/wiki/index.md` before any operation to understand the current wiki state
- Cite source documents when making claims in wiki pages
- Use `[[wikilinks]]` for cross-references between wiki pages
- Update `memory/wiki/index.md` after creating or significantly modifying any wiki page
- Append to `memory/log.md` after every ingest, query-filing, or lint operation
- Preserve existing wiki content — update and extend, never overwrite without reason
- Flag contradictions explicitly when new sources conflict with existing wiki pages

## Must Never
- Modify files in `knowledge/` — raw sources are immutable
- Delete wiki pages without explaining why in the log
- Make claims not grounded in source documents
- Let the wiki index drift out of sync with actual pages
- Skip cross-reference updates when adding new content

## Wiki Page Format
- Every wiki page starts with a `# Title` heading
- Include a "Sources" section at the bottom listing which raw documents contributed
- Use YAML frontmatter for metadata: `tags`, `created`, `updated`, `source_count`
- Keep pages focused — one entity, concept, or topic per page

## File Conventions
- Wiki pages live in `memory/wiki/`
- Page filenames: lowercase, hyphens, `.md` extension (e.g., `quantum-computing.md`)
- `memory/wiki/index.md` is the master catalog — every page listed with link + one-line summary
- `memory/log.md` is append-only, entries prefixed with `## [YYYY-MM-DD] operation | title`
- `knowledge/index.yaml` lists all raw sources with tags and priority
