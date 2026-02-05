module Api
  module V1
    class UsersController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :activate, :verify_token ]

      def verify_token
        if params[:token].blank?
          render json: {
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired invite link. Contact your group admin.",
              field: "token"
            }
          }, status: :unprocessable_entity
          return
        end

        user = User.find_by_token_for(:invite, params[:token])

        if user.nil?
          render json: {
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired invite link. Contact your group admin.",
              field: "token"
            }
          }, status: :unprocessable_entity
          return
        end

        if user.activated?
          render json: {
            error: {
              code: "ALREADY_ACTIVATED",
              message: "Account already activated",
              field: "token"
            }
          }, status: :unprocessable_entity
          return
        end

        render json: { data: { nickname: user.nickname } }, status: :ok
      end

      def activate
        # Validate token presence
        if params[:token].blank?
          render json: {
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired invite link. Contact your group admin.",
              field: "token"
            }
          }, status: :unprocessable_entity
          return
        end

        # Find user by token (returns nil if token expired or invalid)
        user = User.find_by_token_for(:invite, params[:token])

        # If token doesn't find a user, check if it's because user is already activated
        if user.nil?
          # Try to find user without token validation to check activation status
          # This is a workaround since find_by_token_for returns nil for activated users
          # We need to decode the token to get user_id, but for simplicity, we'll just return INVALID_TOKEN
          # A more robust implementation would decode the token to distinguish between expired and already-activated

          # For now, return generic INVALID_TOKEN error
          # The token becomes invalid when user activates, so this covers both cases
          render json: {
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired invite link. Contact your group admin.",
              field: "token"
            }
          }, status: :unprocessable_entity
          return
        end

        # At this point, user was found and token is valid
        # Check if user is already activated (shouldn't happen since token invalidates on activation)
        if user.activated?
          render json: {
            error: {
              code: "ALREADY_ACTIVATED",
              message: "Account already activated",
              field: "token"
            }
          }, status: :unprocessable_entity
          return
        end

        # Validate password presence
        if params[:password].blank?
          render json: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Password can't be blank",
              field: "password"
            }
          }, status: :unprocessable_entity
          return
        end

        # Set password and activate user
        user.password = params[:password]
        user.password_confirmation = params[:passwordConfirmation]
        user.activated = true

        if user.save
          # Create session (auto-login)
          session[:user_id] = user.id

          # Return user data
          render json: {
            data: UserSerializer.serialize(user)
          }, status: :ok
        else
          # Handle validation errors
          render json: {
            error: {
              code: "VALIDATION_ERROR",
              message: user.errors.full_messages.join(", "),
              field: user.errors.attribute_names.first&.to_s
            }
          }, status: :unprocessable_entity
        end
      end
    end
  end
end
