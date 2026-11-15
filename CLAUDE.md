# Session settings

- Use the Sonnet 5.5 model at Medium effort.
- Do not use ultracode or multi-agent workflows unless I explicitly ask for them.

## Token budget

Keep token use as low as possible. I run several projects with Claude.

- Keep replies short. No recaps of what I can see in the diff.
- Do not spawn subagents or workflows unless I ask.
- Read only the files and line ranges needed. Use Grep or Glob before reading whole files.
- Do not re-read files after editing them.
- Do not run graphify or broad codebase scans unless I ask.
- Ask one short question when the request is unclear, instead of exploring.
