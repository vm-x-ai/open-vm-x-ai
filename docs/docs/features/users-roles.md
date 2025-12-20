---
sidebar_position: 1
---

# Users and Roles

VM-X AI provides fine-grained access control through **Users** and **Roles**. This guide explains how to manage users and configure role-based permissions.

## Users

Users represent individuals who can access VM-X AI. Users can:

- Be assigned to workspaces as members or owners
- Have roles assigned for fine-grained permissions
- Access resources based on their permissions

### Creating a User

#### Via UI

1. Navigate to **Settings** → **Users**
2. Click **Create User**
3. Fill in user details:
   - **Username**: Unique username
   - **Email**: User email address
   - **Password**: User password (or generate one)

#### Via API

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "username": "john.doe",
    "email": "john.doe@example.com",
    "password": "secure-password"
  }'
```

### Updating a User

#### Via UI

1. Navigate to **Settings** → **Users**
2. Click on a user
3. Click **Edit**
4. Update user details
5. Click **Save**

#### Via API

```bash
curl -X PATCH http://localhost:3000/api/v1/users/{userId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "email": "new-email@example.com"
  }'
```

### Deleting a User

#### Via UI

1. Navigate to **Settings** → **Users**
2. Click on a user
3. Click **Delete**
4. Confirm deletion

#### Via API

```bash
curl -X DELETE http://localhost:3000/api/v1/users/{userId} \
  -H "Authorization: Bearer your-api-key"
```

## Roles

Roles manage permissions using granular policies. Each role defines:

- **Actions**: What operations can be performed
- **Resources**: What resources can be accessed
- **Effect**: Whether to allow or deny the action

### Role Policy Structure

A role policy consists of statements:

```json
{
  "statements": [
    {
      "effect": "ALLOW",
      "actions": ["ai-connection:create", "ai-connection:get"],
      "resources": ["workspace:*:environment:*:ai-connection:*"]
    },
    {
      "effect": "DENY",
      "actions": ["workspace:delete"],
      "resources": ["workspace:*"]
    }
  ]
}
```

### Wildcards

Roles support wildcards for flexible permission management:

- `*` matches any value
- `?` matches a single character

Examples:
- `workspace:*` matches all workspaces
- `workspace:production` matches only the "production" workspace
- `*:get` matches all "get" actions
- `ai-connection:*` matches all AI connection actions

### Default Roles

VM-X AI includes three default roles:

#### Admin

Full access to everything:

```json
{
  "statements": [
    {
      "effect": "ALLOW",
      "actions": ["*"],
      "resources": ["*"]
    }
  ]
}
```

#### Power User

Can create workspaces, environments, connections, and resources, but cannot manage roles or users:

```json
{
  "statements": [
    {
      "effect": "DENY",
      "actions": ["user:*", "role:*"],
      "resources": ["*"]
    },
    {
      "effect": "ALLOW",
      "actions": ["*"],
      "resources": ["*"]
    }
  ]
}
```

#### Read Only

Can only read/list resources:

```json
{
  "statements": [
    {
      "effect": "ALLOW",
      "actions": ["*:get", "*:list"],
      "resources": ["*"]
    }
  ]
}
```

### Creating a Custom Role

#### Via UI

1. Navigate to **Settings** → **Roles**
2. Click **Create Role**
3. Fill in role details:
   - **Name**: Role name
   - **Description**: Role description
   - **Policy**: Define policy statements

4. Add policy statements:
   - **Effect**: ALLOW or DENY
   - **Actions**: List of actions (e.g., `ai-connection:create`)
   - **Resources**: List of resources (e.g., `workspace:*:environment:*:ai-connection:*`)

#### Via API

```bash
curl -X POST http://localhost:3000/api/v1/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "name": "developer",
    "description": "Developer role with limited permissions",
    "policy": {
      "statements": [
        {
          "effect": "ALLOW",
          "actions": [
            "ai-connection:create",
            "ai-connection:get",
            "ai-connection:list",
            "ai-resource:create",
            "ai-resource:get",
            "ai-resource:list"
          ],
          "resources": [
            "workspace:*:environment:*:ai-connection:*",
            "workspace:*:environment:*:ai-resource:*"
          ]
        },
        {
          "effect": "DENY",
          "actions": ["workspace:delete", "environment:delete"],
          "resources": ["*"]
        }
      ]
    }
  }'
```

### Available Actions

Actions follow the pattern: `{module}:{operation}`

Common actions:
- `workspace:create`, `workspace:get`, `workspace:list`, `workspace:update`, `workspace:delete`
- `environment:create`, `environment:get`, `environment:list`, `environment:update`, `environment:delete`
- `ai-connection:create`, `ai-connection:get`, `ai-connection:list`, `ai-connection:update`, `ai-connection:delete`
- `ai-resource:create`, `ai-resource:get`, `ai-resource:list`, `ai-resource:update`, `ai-resource:delete`
- `api-key:create`, `api-key:get`, `api-key:list`, `api-key:update`, `api-key:delete`
- `user:create`, `user:get`, `user:list`, `user:update`, `user:delete`
- `role:create`, `role:get`, `role:list`, `role:update`, `role:delete`

### Resource Patterns

Resources follow the pattern: `{module}:{identifier}:{submodule}:{identifier}:...`

Examples:
- `workspace:*` - All workspaces
- `workspace:production` - Specific workspace
- `workspace:*:environment:*` - All environments in all workspaces
- `workspace:production:environment:staging` - Specific environment
- `workspace:*:environment:*:ai-connection:*` - All AI connections
- `workspace:production:environment:staging:ai-connection:openai` - Specific AI connection

## Assigning Roles to Users

### Via UI

1. Navigate to **Settings** → **Users**
2. Click on a user
3. Click **Roles**
4. Click **Assign Role**
5. Select a role
6. Click **Assign**

### Via API

```bash
curl -X POST http://localhost:3000/api/v1/users/{userId}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "roleId": "role-id"
  }'
```

## Best Practices

### 1. Principle of Least Privilege

- Grant only the minimum permissions needed
- Use DENY statements to explicitly block actions
- Review permissions regularly

### 2. Use Default Roles When Possible

- Start with default roles (admin, power-user, read-only)
- Create custom roles only when needed
- Document custom role purposes

### 3. Organize by Function

Create roles for:
- Different job functions (developer, operator, viewer)
- Different teams
- Different access levels

### 4. Test Permissions

- Test role permissions before assigning
- Verify users can perform required actions
- Verify users cannot perform unauthorized actions

### 5. Regular Review

- Review user roles regularly
- Remove unused roles
- Update roles as requirements change

## Troubleshooting

### User Cannot Perform Action

If a user cannot perform an action:

1. **Check Role Assignment**: Verify the user has a role assigned
2. **Check Role Policy**: Verify the role policy allows the action
3. **Check Resource Pattern**: Verify the resource pattern matches
4. **Check DENY Statements**: Verify no DENY statement blocks the action

### Role Not Working

If a role is not working:

1. **Check Policy Syntax**: Verify the policy JSON is valid
2. **Check Action Names**: Verify action names are correct
3. **Check Resource Patterns**: Verify resource patterns match
4. **Check Statement Order**: DENY statements are evaluated first

## Next Steps

- [Workspaces and Environments](./workspaces-environments.md) - Learn about workspace and environment isolation
- [AI Connections](./ai-connections.md) - Create AI provider connections
- [AI Resources](./ai-resources.md) - Create AI resources

