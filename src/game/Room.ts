import { Ws } from "../ws";

export default class Room {
  public id: string;
  private players: Set<Ws>;
  constructor(roomId: string) {
    this.id = roomId;
    this.players = new Set();
  }

  public onPlayerEnter(newPlayer: Ws) {
    this.players.add(newPlayer);
    console.log(newPlayer.playerName, "joined the server.");
  }

  public onMessage(sender: Ws, text: string) {
    console.log(sender.playerName, text);
    const message = JSON.stringify({
      type: "chatMessage",
      data: {
        userName: sender.playerName,
        text,
      },
    });

    for (const player of this.players) {
      if (player.readyState === WebSocket.OPEN && player != sender) {
        player.send(message);
      }
    }
  }

  public onPlayerExit(player: Ws) {
    this.players.delete(player);
    console.log(player.playerName, "left the server.");
  }
}
