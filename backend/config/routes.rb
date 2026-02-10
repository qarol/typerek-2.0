Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resource :sessions, only: [ :create, :destroy ]
      resource :me, only: [ :show ], controller: "me"
      resources :matches, only: [ :index ]

      namespace :admin do
        resources :invitations, only: [ :create ]
        resources :users, only: [ :index, :update ]
      end

      resources :users, only: [] do
        collection do
          get :verify_token
          post :activate
        end
      end
    end
  end
end
