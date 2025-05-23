package rbac

default allow := false

# Allow if user has the required permission for the action in the specified tenant
allow if {
	# Debug information
	input.user.role
	input.user.resource
	input.user.action
	
	# Check if the user's role has the required permission
	some role in data.roles
	role.type == input.user.role
	some permission in role.permissions
	permission.resource == input.user.resource
	input.user.action in permission.actions
}