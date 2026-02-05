require "test_helper"

# AdminGuard is tested via integration tests in:
#   test/controllers/api/v1/admin/invitations_controller_test.rb
#
# Coverage includes:
# - Admin user allowed (passes guard)
# - Non-admin user receives 403 FORBIDDEN
# - Unauthenticated user receives 401 UNAUTHORIZED (auth runs first)
