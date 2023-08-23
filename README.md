# tblol_auth

Tblol is a Web app that you could create your dream team with real professionals e-sports players and to compete against others teams!

## auth
This part is responsible for all the logics that involves the user!

## endpoints
Follow below, all the endpoints that there is in this microservices. 

#### Register
"*/newUser"

Params:
     - name: string
     - email: string
     - password: string
     - nickname: string

#### Get all users
"*/allUsers"

#### Login
"*/login"

Params:
     - email: string
     - password: string

#### Get logged user informations
"*/me"

#### logout
"*/logout"

#### to add a player in your team
"*/addPlayer"

Params:
     - playerId: string
