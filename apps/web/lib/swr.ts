export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  keepPreviousData: true,
}
