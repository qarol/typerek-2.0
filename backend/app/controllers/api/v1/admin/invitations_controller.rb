module Api
  module V1
    module Admin
      class InvitationsController < ApplicationController
        include AdminGuard
        before_action :require_admin!

        def create
          # Validate nickname presence
          if params[:nickname].blank?
            render json: {
              error: {
                code: "VALIDATION_ERROR",
                message: "Nickname can't be blank",
                field: "nickname"
              }
            }, status: :unprocessable_entity
            return
          end

          # Check for duplicate nickname (case-insensitive)
          existing_user = User.where("LOWER(nickname) = LOWER(?)", params[:nickname]).first
          if existing_user
            render json: {
              error: {
                code: "VALIDATION_ERROR",
                message: "Nickname already taken",
                field: "nickname"
              }
            }, status: :unprocessable_entity
            return
          end

          # Create user with activated: false, no password
          user = User.new(
            nickname: params[:nickname],
            activated: false
          )

          if user.save
            # Determine base URL from request origin or environment variable
            base_url = request.headers["Origin"] || ENV.fetch("FRONTEND_URL", "http://localhost:5173")

            # Generate invite URL
            invite_url = user.generate_invite_url(base_url)

            render json: {
              data: {
                id: user.id,
                nickname: user.nickname,
                inviteUrl: invite_url
              }
            }, status: :ok
          else
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
end
