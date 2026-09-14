# HoverTV Architecture Constraints

Whenever you are asked to write, refactor, or debug code in the HoverTV workspace, you MUST first read the architecture constraints defined in `.cursorrules` and `.agents/skills/hovertv-architecture/SKILL.md` before taking any action. 

**CRITICAL:** You must run the `view_file` tool to read `.agents/skills/hovertv-architecture/SKILL.md` in full before writing any code.

Strictly enforce the following boundaries:
1. Extension is a dumb pipe.
2. Rust handles OS state. 
3. Frontend handles runtime state and UI. 

Always use the structured log format: `[COMPONENT:MODULE:FUNCTION]`

## Local Toolchain & MSVC Environment
- **DO NOT** attempt to download or install Visual Studio 2022 or C++ Build Tools via `winget` or web installers.
- A complete portable MSVC v14.44.35207 toolchain and Windows SDK 10.0.19041.0 are pre-installed at `D:\Extras\ES\msvc`.
- Rust `cargo` and `rustc` linkers are configured via `~/.cargo/config.toml` to use `D:\Extras\ES\msvc\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64\link.exe` and its companion SDK libraries.
