import * as React from "react"

export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    title?: string
    description?: string
    variant?: "default" | "destructive"
  }>>([])

  const addToast = React.useCallback(({
    title,
    description,
    variant = "default",
  }: {
    title?: string
    description?: string
    variant?: "default" | "destructive"
  }) => {
    const id = Math.random().toString(36).substring(2, 11)
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, title, description, variant },
    ])
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    )
  }, [])

  return {
    toasts,
    toast: addToast,
    removeToast,
  }
}
