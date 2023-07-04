import { Devo } from '@/types';
import { validateResponse } from './base';

export async function getDevo(id: string, init?: RequestInit) {
  let error = undefined;
  const response = await fetch(`/api/devos/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...init,
  });
  const { error: valError } = validateResponse(response);
  error = valError;
  const data: Devo = await response.json();
  return {
    devo: data,
    error,
  };
}

export async function getDevos(init?: RequestInit) {
  let error = undefined;
  const response = await fetch('/api/devos', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...init,
  });
  const { error: valError } = validateResponse(response);
  error = valError;

  const data = await response.json();
  let devos: Devo[] = data.entities;
  devos = devos.sort((a, b) => {
    return a.created > b.created ? -1 : 1;
  });
  return { devos, error };
}
