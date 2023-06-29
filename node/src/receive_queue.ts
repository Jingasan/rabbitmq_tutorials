import amqp from "amqplib";

// キュー名
const queueName = "queue";

const main = async () => {
  // RabbitMQとの通信確立
  const connection = await amqp.connect("amqp://guest:guest@localhost:5672");
  const channel = await connection.createConfirmChannel();
  // キューの作成
  await channel.assertQueue(queueName, {
    durable: true, // 再起動時にキューを残さない
  });
  // メッセージの受信
  console.log(
    `[INFO] Waiting for message in ${queueName}. To exit press CTRL+C`
  );
  await channel.consume(queueName, async (msg) => {
    if (msg) {
      console.log("[INFO] Receive message: " + msg.content.toString());
      // メッセージの受信に成功した為、ACK応答を返す -> キューのメッセージが削除される
      channel.ack(msg);
    } else {
      console.error("[ERROR] Receive null message");
    }
  });
};
main();
