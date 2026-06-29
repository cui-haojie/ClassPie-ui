export function connectLiveSocket(room, token, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = import.meta.env.DEV ? window.location.host : 'localhost:9090'
  const socket = new WebSocket(`${protocol}://${host}/ws/live`)
  socket.onopen = () => {
    socket.send(JSON.stringify({ action: 'subscribe', room, token }))
  }
  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload?.type && payload.type !== 'subscribed') {
        onMessage?.(payload)
      }
    } catch (e) {
      // ignore
    }
  }
  return socket
}
