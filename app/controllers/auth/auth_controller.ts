import type { HttpContext } from '@adonisjs/core/http'
import { registerValidator, loginValidator, onlyEmailValidator, resetPasswordValidator } from '#validators/auth/user'
import User from '#models/user'
import { MailService } from '#services/mail_service'
import { inject } from '@adonisjs/core/container'
import PrimaryException  from '#exceptions/primary_exception'
import { DateTime } from 'luxon'
@inject()
export default class AuthController {


   constructor(private mailService: MailService){}


    async register({request, response}: HttpContext){

      try{

        const {firstName, lastName, email, password, phone, birthDate, photo, globalRating, numberOfTrips} = await request.validateUsing(registerValidator)

        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            birthDate:DateTime.fromJSDate(birthDate),
            photo,
            globalRating,
            numberOfTrips,
            password,
            isAdmin: false,
            isActive: true,

        })

     const mailResponse = await this.mailService.sendMail(user,'Verify your email', 'emails/email-verification', 'emailVerification')

        return response.status(201).json({
            message: 'User created successfully',
            mailResponse: mailResponse,
            user
        })

      } catch (error) {
        console.error('Error while creating user:', error)
        return response.status(400).json({
            message: 'User creation failed',
            error: error.message
        })
      }
    }

    async login({ request, response }: HttpContext) {

        try{
            const { email, password } = await request.validateUsing(loginValidator)

            const user = await User.verifyCredentials(email, password)

            if (user.emailVerified === false) {
            throw new PrimaryException('email not verified',{code:'UNVERIFIED_EMAIL', status:400})
            }

            if(user.isActive === false) {
                throw new PrimaryException('user is not active',{code:'USER_NOT_ACTIVE', status:400})
            }
            const token = await User.accessTokens.create(user)
            return response.status(200).send({ token })
        }catch(error){
        return response.status(400).json({
            message: 'Login failed',
            error
        })
        }

    }

    async logout({ auth, response }: HttpContext) {
        try {
          const user = auth.getUserOrFail()
          const token = user.currentAccessToken.identifier
          if (!token) {
            throw new PrimaryException('token not found',{code:'TOKEN_NOT_FOUND', status:400})
          }
          await User.accessTokens.delete(user, token)
          return response.status(200).send({ message: 'user logged out successfully' })
        } catch (error) {
          console.error('Error while logging out user:', error)
          return response.status(400).send({ message: 'something went wrong', error: error })
        }
    }

    async currentUser({ auth, response }: HttpContext) {
      try {
          const user = auth.getUserOrFail()
          return response.status(200).send({ user })
        } catch (error) {
          return response.status(400).send({ message: 'something went wrong', error: error })
        }
      }

    async resendEmail({request, response}: HttpContext){
      try{
        const {email} = await request.validateUsing(onlyEmailValidator)
        const user = await User.findBy('email', email)
        if(!user){
          throw new PrimaryException('User not found',{code:'USER_NOT_FOUND', status:400})
        }
        const mailResponse = await this.mailService.sendMail(user,'Verify your email', 'emails/email-verification', 'emailVerification')
        return response.status(200).json({
          message: mailResponse.message
        })
      }catch(error){
        return response.status(400).json({
          message: 'Email sending failed',
          error: error.message
        })
      }
    }

    async verifyEmail({request, response}: HttpContext){
        try{
            const token = request.qs().token
            if (!token) {
                throw new PrimaryException('Token is required',{code:'TOKEN_REQUIRED', status:400})
            }
            const mailResponse = await this.mailService.verifyEmail(token)
            return response.status(200).json({
              message: mailResponse.message
            })
        }catch(error){
            return response.status(400).json({
                message: 'Email verification failed',
                error
            })
        }
    }

    async forgotPassword({request, response}: HttpContext){

      try{

        const {email} = await request.validateUsing(onlyEmailValidator)
        const user = await User.findBy('email', email)
        if(!user){
          throw new PrimaryException('User not found',{code:'USER_NOT_FOUND', status:400})
        }

        const mailResponse = await this.mailService.sendMail(user,'Reset your password', 'emails/forgot-password', 'passwordReset')

        return response.status(200).json({
          message: mailResponse.message
        })
        }
      catch(error){
        console.error('Error while sending password reset email:', error)
          return response.status(400).json({
            message: 'Email sending failed',
            error
          })
        }
    }

    async resetPassword({request, response}: HttpContext){
      try{
        const token = request.qs().token
        if (!token) {
            throw new PrimaryException('Token is required',{code:'TOKEN_REQUIRED', status:400})
        }

        const {password} = await request.validateUsing(resetPasswordValidator)

        const mailResponse = await this.mailService.resetPassword(token, password)

        return response.status(200).json({
          message: mailResponse.message
        })
      }catch(error){
        return response.status(400).json({
          message: 'Password reset failed',
          error
        })
      }
    }
}