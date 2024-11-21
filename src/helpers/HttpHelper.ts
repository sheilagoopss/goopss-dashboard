import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

interface HTTPHelperInterface {
  get(url: string, request?: AxiosRequestConfig): Promise<AxiosResponse | null>;
  delete(
    url: string,
    request: AxiosRequestConfig,
  ): Promise<AxiosResponse | null>;
  post(url: string, request: AxiosRequestConfig): Promise<AxiosResponse | null>;
  put(url: string, request: AxiosRequestConfig): Promise<AxiosResponse | null>;
  patch(
    url: string,
    request: AxiosRequestConfig,
  ): Promise<AxiosResponse | null>;
}

class HTTPHelperService implements HTTPHelperInterface {
  async get(
    url: string,
    request?: AxiosRequestConfig,
  ): Promise<AxiosResponse | null> {
    try {
      const config: AxiosRequestConfig = {
        method: "get",
        url,
        data: request?.data,
      };
      const response = await axios(config);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async delete(
    url: string,
    request?: AxiosRequestConfig,
  ): Promise<AxiosResponse | null> {
    try {
      const config: AxiosRequestConfig = {
        method: "delete",
        url,
      };
      const response = await axios(config);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async post(
    url: string,
    request: AxiosRequestConfig,
  ): Promise<AxiosResponse | null> {
    try {
      const config: AxiosRequestConfig = {
        method: "post",
        url,
        data: request.data,
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await axios(config);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async put(
    url: string,
    request: AxiosRequestConfig,
  ): Promise<AxiosResponse | null> {
    try {
      const config: AxiosRequestConfig = {
        method: "put",
        url,
        data: request.data,
      };
      const response = await axios(config);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async patch(
    url: string,
    request: AxiosRequestConfig,
  ): Promise<AxiosResponse | null> {
    try {
      const config: AxiosRequestConfig = {
        method: "patch",
        url,
        data: request.data,
      };
      const response = await axios(config);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

const HttpHelper = new HTTPHelperService();

export default HttpHelper;
