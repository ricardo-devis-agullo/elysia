import type { HTTPStatusName, StatusMap } from './utils'
import type { Cookie, ElysiaCookie } from './cookies'

import type {
	RouteSchema,
	Prettify,
	GetPathParameter,
	SingletonBase
} from './types'
import { error, type ELYSIA_RESPONSE } from './error'

type InvertedStatusMap = { [K in keyof StatusMap as StatusMap[K]]: K }
type InvertedStatusMapKey = keyof InvertedStatusMap

type WithoutNullableKeys<Type> = {
	[Key in keyof Type]-?: NonNullable<Type[Key]>
}

export type Context<
	in out Route extends RouteSchema = {},
	in out Singleton extends SingletonBase = {
		decorator: {}
		store: {}
		derive: {}
		resolve: {}
	},
	Path extends string = ''
> = Prettify<
	{
		body: Route['body']
		query: undefined extends Route['query']
			? Record<string, string | undefined>
			: Route['query']
		params: undefined extends Route['params']
			? Path extends `${string}/${':' | '*'}${string}`
				? Record<GetPathParameter<Path>, string>
				: never
			: Route['params']
		headers: undefined extends Route['headers']
			? Record<string, string | undefined>
			: Route['headers']
		cookie: undefined extends Route['cookie']
			? Record<string, Cookie<any>>
			: Record<string, Cookie<any>> &
					WithoutNullableKeys<{
						[key in keyof Route['cookie']]: Cookie<
							Route['cookie'][key]
						>
					}>

		set: {
			headers: Record<string, string> & {
				'Set-Cookie'?: string | string[]
			}
			status?: number | HTTPStatusName
			redirect?: string
			/**
			 * ! Internal Property
			 *
			 * Use `Context.cookie` instead
			 */
			cookie?: Record<string, ElysiaCookie>
		}

		path: string
		request: Request
		store: Singleton['store']
	} & (Route['response'] extends { 200: unknown }
		? {
				error: <
					const Code extends
						| keyof Route['response']
						| InvertedStatusMap[Extract<
								InvertedStatusMapKey,
								keyof Route['response']
						  >],
					const T extends Code extends keyof Route['response']
						? Route['response'][Code]
						: Code extends keyof StatusMap
						? // @ts-ignore StatusMap[Code] always valid because Code generic check
						  Route['response'][StatusMap[Code]]
						: never
				>(
					code: Code,
					response: T
				) => {
					[ELYSIA_RESPONSE]: Code extends keyof StatusMap
						? StatusMap[Code]
						: Code
					response: T
					_type: {
						[ERROR_CODE in Code extends keyof StatusMap
							? StatusMap[Code]
							: Code]: T
					}
				}
		  }
		: {
				error: typeof error
		  }) &
		Singleton['decorator'] &
		Singleton['derive'] &
		Singleton['resolve']
>

// Use to mimic request before mapping route
export type PreContext<
	in out Singleton extends SingletonBase = {
		decorator: {}
		store: {}
		derive: {}
		resolve: {}
	}
> = Prettify<
	{
		store: Singleton['store']
		request: Request

		set: {
			headers: { [header: string]: string } & {
				['Set-Cookie']?: string | string[]
			}
			status?: number
			redirect?: string
		}

		error: typeof error
	} & Singleton['decorator']
>
