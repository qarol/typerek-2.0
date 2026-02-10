require "test_helper"

# OwnershipGuard is tested via integration tests in:
#   test/controllers/api/v1/bets_controller_test.rb
#
# Coverage includes:
# - Owner allowed (passes guard)
# - Non-owner receives 403 FORBIDDEN
