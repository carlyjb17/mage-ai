import { useMutation } from 'react-query';

import {
  fetchCreate,
  fetchCreateWithParent,
  fetchUpdateWithParent,
  fetchDetailAsync,
  fetchListAsync,
  fetchListWithParentAsync,
  fetchUpdate,
  useDelete,
  useDeleteWithParent,
  useDetail,
  useDetailWithParent,
  useList,
  useListWithParent,
  useUpdate,
} from './utils/use';
import { handle } from '@api/utils/response';
import { onError, onSuccess } from '@api/utils/response';

export const ACTION_EXECUTE = 'execute';
export const ANALYSES = 'analyses';
export const BLOCKS: 'blocks' = 'blocks';
export const COLUMNS: 'columns' = 'columns';
export const DOWNLOADS: 'downloads' = 'downloads';
export const FEATURES: 'features' = 'features';
export const FILE_CONTENTS: 'file_contents' = 'file_contents';
export const FILES: 'files' = 'files';
export const FEATURE_SETS: 'feature_sets' = 'feature_sets';
export const FEATURE_SET_VERSIONS: 'feature_set_versions' = 'feature_set_versions';
export const KERNELS: 'kernels' = 'kernels';
export const KERNEL_ACTION_INTERRUPT: 'interrupt' = 'interrupt';
export const KERNEL_ACTION_RESTART: 'restart' = 'restart';
export const OUTPUTS = 'outputs';
export const PIPELINES: 'pipelines' = 'pipelines';
export const STATUS: 'status' = 'status';
export const TRANSFORMER_ACTIONS: 'transformer_actions' = 'transformer_actions';
export const VARIABLES: 'variables' = 'variables';
export const VERSIONS: 'versions' = 'versions';

// Update this as routes get added
const RESOURCES: any[][] = [
  [ACTION_EXECUTE, PIPELINES],
  [BLOCKS],
  [BLOCKS, PIPELINES],
  [BLOCKS, PIPELINES, ANALYSES],
  [BLOCKS, PIPELINES, OUTPUTS],
  [COLUMNS, FEATURE_SETS],
  [DOWNLOADS, FEATURE_SETS],
  [FEATURE_SETS],
  [FILES],
  [FILE_CONTENTS],
  [KERNELS],
  [KERNEL_ACTION_INTERRUPT, KERNELS],
  [KERNEL_ACTION_RESTART, KERNELS],
  [PIPELINES],
  [STATUS],
  [VARIABLES, PIPELINES],
  [VERSIONS, FEATURE_SETS],
];

const apis: any = {};

RESOURCES.forEach(([resource, parentResource, grandchildResource, swrOptions]) => {
  if (!apis[resource]) {
    apis[resource] = {
      deleteAsync: async (id: string) => {
        const response = await useDelete(resource, id);

        return await handle(response);
      },
      detail: (
        id: string,
        query: any = {},
        swrOptionsRuntime?: any,
      ) => useDetail(
        resource,
        id,
        query,
        {
          ...swrOptions,
          ...swrOptionsRuntime,
        },
      ),
      detailAsync: async (ctx: any, id: string, query: any = {}) => {
        const response = await fetchDetailAsync(ctx, resource, id, query);

        return await handle(response);
      },
      updateAsync: async (ctx: any, id: string, body: any) => {
        const response = await useUpdate(ctx, resource, id, body);

        return await handle(response);
      },
      useUpdate: (id, query: any = {}) => async (body: any) => fetchUpdate(resource, id, body, query),
    };
  }

  if (grandchildResource) {
    apis[resource][parentResource][grandchildResource] = {};
    apis[resource][parentResource][grandchildResource].detail = (
      parentId: string,
      id: string,
      query?: any,
      swrOptionsRuntime?: any,
    ) => useDetailWithParent(
      resource,
      id,
      parentResource,
      parentId,
      query,
      {
        ...swrOptions,
        ...swrOptionsRuntime,
      },
      grandchildResource,
    );
  } else if (parentResource) {
    apis[resource][parentResource] = {};

    apis[resource][parentResource].useCreate = (parentId, opts?: any) => async (body: any) =>
      fetchCreateWithParent(resource, parentResource, parentId, body, opts);

    apis[resource][parentResource].useCreateWithParentIdLater = (opts?: any) => async (opts2: any) =>
      fetchCreateWithParent(resource, parentResource, opts2.parentId, opts2.body, opts);

    apis[resource][parentResource].useUpdate = (parentId: string, id: string, opts?: any) => async (body: any) =>
      fetchUpdateWithParent(resource, parentResource, parentId, id, body, opts);

    apis[resource][parentResource].useDelete = (parentId: string, id: string) => async () => {
      const response = await useDeleteWithParent(resource, parentResource, parentId, id);

      return await handle(response);
    },

    apis[resource][parentResource].listAsync = async (ctx: any, parentId: string, query: any = {}) => {
      const response = await fetchListWithParentAsync(ctx, resource, parentResource, parentId, query);

      return await handle(response);
    };

    apis[resource][parentResource].list = (
      parentId: string,
      query: any = {},
      swrOptionsRuntime?: any,
    ) => useListWithParent(
      resource,
      parentResource,
      parentId,
      query,
      {
        ...swrOptions,
        ...swrOptionsRuntime,
      },
    );

    apis[resource][parentResource].detail = (
      parentId: string,
      id: string,
      query?: any,
      swrOptionsRuntime?: any,
    ) => useDetailWithParent(
      resource,
      id,
      parentResource,
      parentId,
      query,
      {
        ...swrOptions,
        ...swrOptionsRuntime,
      },
    );
  } else {
    apis[resource].create = async (body: any, opts?: any) => {
      const response = await fetchCreate(resource, body, opts);

      return await handle(response);
    };

    apis[resource].useCreate = (opts?: any) =>
      async (body: any) => fetchCreate(resource, body, opts);

    apis[resource].useDelete = (id: string) => async () => {
      const response = await useDelete(resource, id);

      return await handle(response);
    },

    apis[resource].listAsync = async (ctx: any, query: any = {}) => {
      const response = await fetchListAsync(ctx, resource, query);

      return await handle(response);
    };

    apis[resource].list = (
      query: any = {},
      swrOptionsRuntime?: any,
    ) => useList(resource, query, {
      ...swrOptions,
      ...swrOptionsRuntime,
    });
  }
});

export function useCustomFetchRequest({
  endpoint,
  method,
  onSuccessCallback,
}: {
  endpoint: string,
  method: string,
  onSuccessCallback?: (any) => void,
}): [(payload?: any) => void, boolean] {
  const errorMessage = 'Request failed.';
  const successMessage = 'Request successful.';

  const [fetchData, { isLoading }] = useMutation(
    async (payload: any) => fetch(
      `${endpoint}`,
      {
        body: (method === 'GET' || method === 'DELETE')
          ? null
          : JSON.stringify({
            ...payload,
          }),
        method,
      },
    ),
    {
      // @ts-ignore
      onError: (error) => onError(
        error, {
          errorMessage,
        },
      ),
      onSuccess: (response: any) => onSuccess(
        response,
        {
          callback: (res) => {
            onSuccessCallback(res);
            if (!Array.isArray(res) && typeof res === 'object' && res.code && res.code >= 400) {
              console.error(errorMessage);
            } else {
              // console.log(successMessage);
            }
          },
        },
      ),
    },
  );

  return [fetchData, isLoading];
}

export default apis;
