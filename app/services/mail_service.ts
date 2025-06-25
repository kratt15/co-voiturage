import User from '#models/user'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import stringHelpers from '@adonisjs/core/helpers/string'
import Token from '#models/token'
import Env from '#start/env'

export class MailService {
  // Your code here

  async sendMail(user: User, subject: string, htmlView: string, type: string, text = '') {
    try {
      const token = stringHelpers.generateRandom(64)
      let path = ''
      if (type === 'emailVerification') {
        user.emailVerificationToken = token
        user.emailVerificationTokenExpiresAt = DateTime.now().plus({ minutes: 10 })
        await user.save()
        path = 'verify-email'
      }

      if (type === 'passwordReset') {
        await Token.create({
          token,
          email: user.email,
          expiresAt: DateTime.now().plus({ minutes: 10 }),
        })
        path = 'reset-password/change-password'
      }

      const link = `${Env.get('URL_FRONT')}/${path}/${token}`

      await mail.send((message) => {
        message
          // .from(Env.get('MAIL_FROM'))
          .to(user.email)
          .subject(subject)
          .htmlView(htmlView, { user, link, text })
      })

      return { message: 'Email sent successfully' }
    } catch (error) {
      console.error('Mail service error:', error)
      throw new Error('Failed to send verification email: ' + (error as Error).message)
    }
  }

  async verifyEmail(token: string) {
    try {
      const user = await User.findBy('emailVerificationToken', token)
      if (!user) {
        throw new Error('Invalid token')
      }
      if (user.emailVerificationTokenExpiresAt! < DateTime.now()) {
        throw new Error('Token expired')
      }
      user.emailVerified = true
      user.emailVerificationToken = null
      user.emailVerificationTokenExpiresAt = null
      await user.save()

      return { message: 'Email verified successfully' }
    } catch (error) {
      console.error('Mail service error:', error)
      throw new Error('Failed to verify email')
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      const one_token = await Token.findBy('token', token)
      if (!one_token) {
        throw new Error('Invalid token')
      }
      const user = await User.findBy('email', one_token.email)
      if (!user) {
        throw new Error('User not found')
      }
      if (!one_token || one_token.expiresAt < DateTime.now() || one_token.isUsed === true) {
        throw new Error('Token expired')
      }
      one_token.isUsed = true
      await one_token.save()

      user.password = password
      await user.save()
      // await Token.query().where('email', user.email).delete()
      return { message: 'Password reset successful' }
    } catch (error) {
      throw new Error('Failed to verify password reset')
    }
  }
}
