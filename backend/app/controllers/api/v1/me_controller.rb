module Api
  module V1
    class MeController < ApplicationController
      def show
        render json: { data: UserSerializer.serialize(current_user) }
      end
    end
  end
end
