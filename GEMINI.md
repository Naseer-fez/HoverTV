# HoverTV Architecture Constraints

Whenever you are asked to write, refactor, or debug code in the HoverTV workspace, you MUST first read the architecture constraints defined in `.cursorrules` and `.agents/skills/hovertv-architecture/SKILL.md` before taking any action. 

**CRITICAL:** You must run the `view_file` tool to read `.agents/skills/hovertv-architecture/SKILL.md` in full before writing any code.

Strictly enforce the following boundaries:
1. Extension is a dumb pipe.
2. Rust handles OS state. 
3. Frontend handles runtime state and UI. 

Always use the structured log format: `[COMPONENT:MODULE:FUNCTION]`
