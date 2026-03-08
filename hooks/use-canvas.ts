import { useQueryState } from "nuqs"

export const useCanvas = () => {
  const [selectedPageId, setSelectedPageId] = useQueryState(
    'page_id', {
    defaultValue: null,
    parse: (v) => v || null
  }
  )
  return { selectedPageId, setSelectedPageId }
}
