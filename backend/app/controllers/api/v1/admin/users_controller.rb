module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        include AdminGuard
        before_action :require_admin!

        def index
          users = User.order(:nickname)
          render json: {
            data: users.map { |user| UserSerializer.serialize_for_admin(user) },
            meta: { count: users.count }
          }
        end

        def update
          user = User.find_by(id: params[:id])

          unless user
            render json: {
              error: {
                code: "NOT_FOUND",
                message: "User not found",
                field: nil
              }
            }, status: :not_found
            return
          end

          # Self-protection: prevent admin from removing their own admin role
          if user.id == current_user.id && params.key?(:admin) && !ActiveModel::Type::Boolean.new.cast(params[:admin])
            render json: {
              error: {
                code: "SELF_ROLE_CHANGE",
                message: "Cannot remove your own admin role",
                field: "admin"
              }
            }, status: :forbidden
            return
          end

          # Update admin role
          user.admin = params[:admin] if params.key?(:admin)

          if user.save
            render json: {
              data: UserSerializer.serialize_for_admin(user)
            }
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
