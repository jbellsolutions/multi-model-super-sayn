# /cost — Session Cost Summary

Show routing summary and estimated cost savings from session log.

```bash
if [ -f ".claude/session-log.jsonl" ]; then
  echo "=== Session Log Summary ==="
  python3 -c "
import json, sys
from collections import Counter
events = [json.loads(l) for l in open('.claude/session-log.jsonl') if l.strip()]
agents = Counter(e.get('agent','unknown') for e in events)
print(f'Total delegations: {sum(agents.values())}')
for a, c in agents.most_common():
    print(f'  {a}: {c}x')
"
else
  echo "No session log yet. Agents need to append to .claude/session-log.jsonl"
fi
```
