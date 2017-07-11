declare module "webpack-dev-server" {
  // import * as core from "express-serve-static-core"
  import * as http from "http"
  import * as webpack from "webpack"

  namespace WebpackDevServer {
    export interface Configuration {
      contentBase?: string
      hot?: boolean
      https?: boolean
      historyApiFallback?: boolean
      compress?: boolean
      proxy?: any
      staticOptions?: any
      quiet?: boolean
      noInfo?: boolean
      lazy?: boolean
      filename?: string | RegExp
      watchOptions?: webpack.WatchOptions
      publicPath?: string
      headers?: any
      stats?: webpack.compiler.StatsOptions | webpack.compiler.StatsToStringOptions
      public?: string
      disableHostCheck?: boolean

      // setup?(app: core.Express, ctx: any): void
    }

    export interface WebpackDevServer {
      new (webpack: webpack.Compiler,
           config: Configuration): WebpackDevServer

      listen(port: number,
             hostname: string,
             callback?: Function): http.Server

      listen(port: number,
             callback?: Function): http.Server
    }
  }

  const wds: WebpackDevServer.WebpackDevServer
  export default wds
}