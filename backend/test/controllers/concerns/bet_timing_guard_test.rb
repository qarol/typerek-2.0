require "test_helper"

# BetTimingGuard is tested via integration tests in:
#   test/controllers/api/v1/bets_controller_test.rb
#
# Coverage includes:
# - Open match allows mutation (passes guard)
# - Locked match (past kickoff) receives 403 BET_LOCKED
