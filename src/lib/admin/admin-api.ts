"use strict";

import {Path, GET, POST, DELETE, PUT, PathParam, FileParam, FormParam, Errors, Return,
        Accept} from "typescript-rest";
import "es6-promise";
import * as fs from "fs-extra";
import {Gateway} from "../gateway";
import {ApiConfig, validateApiConfig} from "../config/api";
import * as Utils from "underscore";
import * as path from "path";
import {MiddlewareService} from "./middleware";

@Path('middleware')
export class MiddlewareAPI {

    @GET
    @Path('filters')
    filters() : Promise<Array<string>>{
        return MiddlewareService.list('filter');
    }

    @GET
    @Path('interceptors/request')
    requestInterceptors() : Promise<Array<string>>{
        return MiddlewareService.list('interceptor/request');
    }

    @GET
    @Path('interceptors/response')
    responseInterceptors() : Promise<Array<string>>{
        return MiddlewareService.list('interceptor/response');
    }

    @GET
    @Path('authentication/strategies')
    authStrategies() : Promise<Array<string>>{
        return MiddlewareService.list('authentication/strategies');
    }

    @GET
    @Path('authentication/verify')
    authVerify() : Promise<Array<string>>{
        return MiddlewareService.list('authentication/verify');
    }

    @DELETE
    @Path('filters/:name')
    removeFilter(@PathParam("name")name: string) : Promise<void>{
        return MiddlewareService.remove('filter', name);
    }

    @DELETE
    @Path('interceptors/request/:name')
    removeRequestInterceptors(@PathParam("name")name: string) : Promise<void>{
        return MiddlewareService.remove('interceptor/request', name);
    }

    @DELETE
    @Path('interceptors/response/:name')
    removeResponseInterceptors(@PathParam("name")name: string) : Promise<void>{
        return MiddlewareService.remove('interceptor/response', name);
    }

    @DELETE
    @Path('authentication/strategies/:name')
    removeAuthStrategies(@PathParam("name")name: string) : Promise<void>{
        return MiddlewareService.remove('authentication/strategies', name);
    }

    @DELETE
    @Path('authentication/verify/:name')
    removeAuthVerify(@PathParam("name")name: string) : Promise<void>{
        return MiddlewareService.remove('authentication/verify', name);
    }

    @PUT
    @Path('filters/:name')
    saveFilter(@PathParam("name")name: string, @FileParam("file") file: Express.Multer.File) : Promise<void>{
        return MiddlewareService.save(path.join('filter', name), file.buffer);
    }

    @PUT
    @Path('interceptors/request/:name')
    saveRequestInterceptors(@PathParam("name")name: string, @FileParam("file") file: Express.Multer.File) : Promise<void>{
        return MiddlewareService.save(path.join('interceptor/request', name), file.buffer);
    }

    @PUT
    @Path('interceptors/response/:name')
    saveResponseInterceptors(@PathParam("name")name: string, @FileParam("file") file: Express.Multer.File) : Promise<void>{
        return MiddlewareService.save(path.join('interceptor/response', name), file.buffer);
    }

    @PUT
    @Path('authentication/strategies/:name')
    saveAuthStrategies(@PathParam("name")name: string, @FileParam("file") file: Express.Multer.File) : Promise<void>{
        return MiddlewareService.save(path.join('authentication/strategies', name), file.buffer);
    }

    @PUT
    @Path('authentication/verify/:name')
    saveAuthVerify(@PathParam("name")name: string, @FileParam("file") file: Express.Multer.File) : Promise<void>{
        return MiddlewareService.save(path.join('authentication/verify', name), file.buffer);
    }

    @POST
    @Path('filters')
    addFilter(@FileParam("file") file: Express.Multer.File, 
              @FormParam("name") name: string){
        return new Promise<Return.NewResource>((resolve, reject) =>{
            MiddlewareService.add(path.join('filter',name), file.buffer)
                .then(value=>{
                    resolve(new Return.NewResource(path.join('filter',name)));
                })
                .catch(err=>{
                    reject(new Errors.InternalServerError('Error saving filter.'))
                });
        });
    }

    @POST
    @Path('interceptors/request')
    addRequestInterceptors(@FileParam("file") file: Express.Multer.File, 
              @FormParam("name") name: string){
        return new Promise<Return.NewResource>((resolve, reject) =>{
            MiddlewareService.add(path.join('interceptor/request',name), file.buffer)
                .then(value=>{
                    resolve(new Return.NewResource(path.join('interceptors/request',name)));
                })
                .catch(err=>{
                    reject(new Errors.InternalServerError('Error saving interceptor.'))
                });
        });
    }

    @POST
    @Path('interceptors/response')
    addResponseInterceptors(@FileParam("file") file: Express.Multer.File, 
              @FormParam("name") name: string){
        return new Promise<Return.NewResource>((resolve, reject) =>{
            MiddlewareService.add(path.join('interceptor/response',name), file.buffer)
                .then(value=>{
                    resolve(new Return.NewResource(path.join('interceptors/response',name)));
                })
                .catch(err=>{
                    reject(new Errors.InternalServerError('Error saving interceptor.'))
                });
        });
    }

    @POST
    @Path('authentication/strategies')
    addAuthStrategy(@FileParam("file") file: Express.Multer.File, 
                    @FormParam("name") name: string){
        return new Promise<Return.NewResource>((resolve, reject) =>{
            MiddlewareService.add(path.join('authentication/strategies',name), file.buffer)
                .then(value=>{
                    resolve(new Return.NewResource(path.join('authentication/strategies',name)));
                })
                .catch(err=>{
                    reject(new Errors.InternalServerError('Error saving strategy.'))
                });
        });
    }

    @POST
    @Path('authentication/verify')
    addAuthVerify(@FileParam("file") file: Express.Multer.File, 
                    @FormParam("name") name: string){
        return new Promise<Return.NewResource>((resolve, reject) =>{
            MiddlewareService.add(path.join('authentication/verify',name), file.buffer)
                .then(value=>{
                    resolve(new Return.NewResource(path.join('authentication/verify',name)));
                })
                .catch(err=>{
                    reject(new Errors.InternalServerError('Error saving verify function.'))
                });
        });
    }
}

// @Path('apis')
// export class APIService {
//     @GET
//     search() : Promise<Array<ApiConfig>>{
//         return new Promise<Array<ApiConfig>>((resolve, reject) =>{
//             resolve(AdminServer.gateway.apis);
//         });
//     }

//     @POST
//     addApi(api: ApiConfig) {
//         validateApiConfig(api, (error, value:ApiConfig)=>{
// //            AdminServer.gateway.addApi(value);
//         })
//     }

//     @GET
//     @Path(":name")
//     getApi(@PathParam("name")name: string) : Promise<Array<ApiConfig>>{
//         return new Promise<Array<ApiConfig>>((resolve, reject) =>{
//             resolve(Utils.filter(AdminServer.gateway.apis, (apiConfig)=>{
//                 return name === apiConfig.name;
//             }));
//         });
//     }
// }