package rbac

default allow = false

# Allow if user has the required permission for the action in the specified tenant
allow if {
    # Check if the user's role has the required permission
    some i
    data.roles[i].id == input.user.role
    data.roles[i].tenantId == input.user.tenantId
    some j
    data.roles[i].permissions[j].resource == input.resource
    input.action == data.roles[i].permissions[j].actions[_]
} 