module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_user!, only: :create

      def create
        # Validate presence of credentials
        if params[:nickname].blank? || params[:password].blank?
          render json: {
            error: { code: "INVALID_CREDENTIALS", message: "Incorrect nickname or password", field: nil }
          }, status: :unauthorized
          return
        end

        user = User.where("LOWER(nickname) = LOWER(?)", params[:nickname]).first

        # Always perform BCrypt operation to prevent timing attacks
        if user
          authenticated = user.authenticate(params[:password])
        else
          # Dummy BCrypt hash to match timing of real authentication
          BCrypt::Password.create("dummy")
          authenticated = false
        end

        if authenticated && user.activated?
          session[:user_id] = user.id
          render json: { data: UserSerializer.serialize(user) }
        else
          render json: {
            error: { code: "INVALID_CREDENTIALS", message: "Incorrect nickname or password", field: nil }
          }, status: :unauthorized
        end
      end

      def destroy
        reset_session
        head :no_content
      end
    end
  end
end
