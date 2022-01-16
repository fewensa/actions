Actions group
===


## Clone Any

### Clone a repository via https

```
- name: Clone repository
  uses: fewensa/clone-any-action@v1
  with:
    repository: 'https://github.com/org/repo'
```

### Clone a repository via ssh

```
- name: Clone repository
  uses: fewensa/clone-any-action@v1
  with:
    repository: 'git@github.com:org/repo.git'
    ssh-key: |
      ---PRIVATE KEY---
      ...
      ---END---
```

