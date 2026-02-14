---
name: git-workflow
description: Git workflow cheat sheet for master/production branch strategy. Use when the user asks about git workflows, branching, merging, deploying, or creating PRs.
user-invocable: true
---

# Git Workflow Cheat Sheet

## Branch Flow (ONE direction only)

```
feature-branch → master → production
```

**NEVER merge production back into master.**

## Feature Development

```bash
# 1. Start from up-to-date master
git checkout master
git pull origin master

# 2. Create feature branch
git checkout -b task/my-feature

# 3. Work, commit, push
git add <specific-files>
git commit -m "description"
git push origin task/my-feature

# 4. Create PR: task/my-feature → master (SQUASH MERGE)

# 5. After merge, clean up
git checkout master
git pull origin master
git branch -d task/my-feature
```

## Deploy to Production

```bash
# Option A: Fast-forward (preferred, no merge commit)
git checkout production
git pull origin production
git merge master --ff-only
git push origin production

# Option B: GitHub PR (master → production)
# Use REGULAR MERGE (never squash for this!)
```

## Hotfix on Production

```bash
# 1. Branch from production
git checkout production
git checkout -b hotfix/fix-something

# 2. Fix, commit, push, PR → production (squash merge)

# 3. Cherry-pick back to master (NEVER merge production → master)
git checkout master
git cherry-pick <commit-hash>
git push origin master
```

## Merge Strategy Rules

| Scenario | Strategy | Why |
|---|---|---|
| feature → master | **Squash merge** | Clean history, one commit per feature |
| master → production | **Regular merge / fast-forward** | Preserves relationship, prevents divergence |
| hotfix → master | **Cherry-pick** | Avoids circular merge |
| production → master | **NEVER** | Causes circular merge loop |
| production → feature | **NEVER** | Tangles the graph |

## Emergency: Fix Diverged Branches

If master and production diverge again:

```bash
# Check the difference
git diff master production --stat
git rev-list --left-right --count master...production

# If production has no unique code, reset it
git checkout production
git reset --hard master
git push origin production --force
```
