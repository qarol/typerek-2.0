require "test_helper"

module Api
  module V1
    module Admin
      class UsersControllerTest < ActionDispatch::IntegrationTest
        # Test fixtures: admin, player, inactive
        fixtures :users

        test "GET /api/v1/admin/users returns all users for admin" do
          # Login as admin
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          # Get all users
          get api_v1_admin_users_url
          assert_response :success

          body = JSON.parse(@response.body)
          assert body["data"]
          assert body["meta"]
          assert_equal 3, body["meta"]["count"]

          # Verify camelCase keys
          first_user = body["data"].first
          assert first_user.key?("id")
          assert first_user.key?("nickname")
          assert first_user.key?("admin")
          assert first_user.key?("activated")

          # Verify data includes all users ordered by nickname
          nicknames = body["data"].map { |u| u["nickname"] }
          assert_equal nicknames.sort, nicknames
        end

        test "GET /api/v1/admin/users returns 403 for non-admin" do
          # Login as player
          post api_v1_sessions_url, params: { nickname: "tomek", password: "password" }
          assert_response :success

          # Attempt to get users
          get api_v1_admin_users_url
          assert_response :forbidden

          body = JSON.parse(@response.body)
          assert_equal "FORBIDDEN", body["error"]["code"]
        end

        test "GET /api/v1/admin/users returns 401 for unauthenticated" do
          get api_v1_admin_users_url
          assert_response :unauthorized

          body = JSON.parse(@response.body)
          assert_equal "UNAUTHORIZED", body["error"]["code"]
        end

        test "PUT /api/v1/admin/users/:id grants admin role to player" do
          # Login as admin
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          player = users(:player)
          assert_not player.admin

          # Grant admin role
          put api_v1_admin_user_url(player.id), params: { admin: true }
          assert_response :success

          body = JSON.parse(@response.body)
          assert body["data"]
          assert_equal true, body["data"]["admin"]

          # Verify database update
          player.reload
          assert player.admin
        end

        test "PUT /api/v1/admin/users/:id revokes admin role from another admin" do
          # Login as admin
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          # Create another admin
          another_admin = User.create!(
            nickname: "another_admin",
            password: "password",
            password_confirmation: "password",
            admin: true,
            activated: true
          )

          # Revoke admin role
          put api_v1_admin_user_url(another_admin.id), params: { admin: false }
          assert_response :success

          body = JSON.parse(@response.body)
          assert_equal false, body["data"]["admin"]

          # Verify database update
          another_admin.reload
          assert_not another_admin.admin
        end

        test "PUT /api/v1/admin/users/:id rejects self admin role removal" do
          # Login as admin
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          admin = users(:admin)

          # Attempt to remove own admin role
          put api_v1_admin_user_url(admin.id), params: { admin: false }
          assert_response :forbidden

          body = JSON.parse(@response.body)
          assert_equal "SELF_ROLE_CHANGE", body["error"]["code"]
          assert_equal "Cannot remove your own admin role", body["error"]["message"]
          assert_equal "admin", body["error"]["field"]

          # Verify admin role unchanged
          admin.reload
          assert admin.admin
        end

        test "PUT /api/v1/admin/users/:id returns 403 for non-admin" do
          # Login as player
          post api_v1_sessions_url, params: { nickname: "tomek", password: "password" }
          assert_response :success

          another_player = users(:inactive)

          # Attempt to grant admin role
          put api_v1_admin_user_url(another_player.id), params: { admin: true }
          assert_response :forbidden

          body = JSON.parse(@response.body)
          assert_equal "FORBIDDEN", body["error"]["code"]
        end

        test "PUT /api/v1/admin/users/:id returns 404 for non-existent user" do
          # Login as admin
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          # Attempt to update non-existent user
          put api_v1_admin_user_url(99999), params: { admin: true }
          assert_response :not_found

          body = JSON.parse(@response.body)
          assert_equal "NOT_FOUND", body["error"]["code"]
        end

        test "response format uses camelCase for all endpoints" do
          # Login as admin
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          # Test index response
          get api_v1_admin_users_url
          body = JSON.parse(@response.body)
          first_user = body["data"].first

          # All keys should be camelCase
          assert first_user.key?("id")
          assert first_user.key?("nickname")
          assert first_user.key?("admin")
          assert first_user.key?("activated")
          assert_not first_user.key?("admin_role")
          assert_not first_user.key?("activated_at")

          # Test update response
          player = users(:player)
          put api_v1_admin_user_url(player.id), params: { admin: true }
          body = JSON.parse(@response.body)

          assert body["data"].key?("id")
          assert body["data"].key?("nickname")
          assert body["data"].key?("admin")
          assert body["data"].key?("activated")
        end
      end
    end
  end
end
