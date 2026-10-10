import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class HttpService {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 10000,
      maxRedirects: 5,
    });
  }

  get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return new Observable<AxiosResponse<T>>((subscriber) => {
      this.axios
        .get<T>(url, config)
        .then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return new Observable<AxiosResponse<T>>((subscriber) => {
      this.axios
        .post<T>(url, data, config)
        .then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return new Observable<AxiosResponse<T>>((subscriber) => {
      this.axios
        .put<T>(url, data, config)
        .then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return new Observable<AxiosResponse<T>>((subscriber) => {
      this.axios
        .delete<T>(url, config)
        .then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return new Observable<AxiosResponse<T>>((subscriber) => {
      this.axios
        .patch<T>(url, data, config)
        .then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }
}
