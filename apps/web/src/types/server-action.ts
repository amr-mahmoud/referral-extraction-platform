/** The shape every Server Action in `src/server-actions/` resolves to. */
export interface ActionResult<TData> {
  success: boolean;
  data?: TData;
  error?: string;
}
