# Memory Consolidation System

## Instructions for Cron Jobs

### Nightly Memory Consolidation (2am)
When triggered with "ConsolidateMemory" or similar:

1. Read ALL session files from `C:\Users\ProjectDev\.openclaw\agents\main\sessions\` including:
   - Direct Telegram chats (telegram:direct:*)
   - Group chats (telegram:group:*) - **IMPORTANT: Include AiDeas group**
   - Webchat sessions
   
2. Extract:
   - Key decisions made
   - Important information about Varg
   - Tasks discussed
   - Business ideas
   - Any action items

3. Update `memory/daily/YYYY-MM-DD.md` with:
   - Highlights
   - Decisions Made
   - Tasks / Action Items
   - Priority Items (P1-P3)
   - Notes about AiDeas group discussions

4. Update `memory/para.md` if new projects/areas/resources

5. Run `npx openclaw memory index`

### Morning Priority Summary (8am)
When triggered with "MorningPrioritySummary":

1. Read `memory/para.md` and `memory/daily/*.md`

2. Create prioritized list:
   - P1: Do today
   - P2: This week  
   - P3: Backlog

3. Send to Telegram direct chat

## Session Files to Read
- agent:main:telegram:direct:8754108637.jsonl
- agent:main:telegram:group:-1003783041506.jsonl (AiDeas)
- agent:main:main.jsonl
