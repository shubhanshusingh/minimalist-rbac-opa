package rbac

# Default deny
default allow = false

# Define roles and permissions
roles = {
    "admin": {
        "permissions": [
            {
                "resource": "*",
                "actions": ["*"]
            }
        ]
    },
    "user": {
        "permissions": [
            {
                "resource": "profile",
                "actions": ["read", "update"]
            }
        ]
    }
}

# Allow if user has the required permission through their roles
allow if {
    # Get user roles
    user_roles := input.user.roles
    # Check if any role has the required permission
    role_has_permission(user_roles)
}

# Helper function to check if any role has the required permission
role_has_permission(user_roles) if {
    some i
    role := roles[user_roles[i]]
    some j
    permission := role.permissions[j]
    permission.resource == input.resource
    permission.actions[_] == input.action
} 