// Endpoint which only prints a random string
export const debug = (req, res) => {
  res.status(200).send("Debug content");
};
