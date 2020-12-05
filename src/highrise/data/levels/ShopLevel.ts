import { Matrix } from "pixi.js";
import { choose, seededShuffle } from "../../../core/util/Random";
import { POSSIBLE_ORIENTATIONS } from "./levelGeneration";
import LevelTemplate from "./LevelTemplate";
import BathroomTemplate from "./rooms/BathroomTemplate";
import RoomTemplate from "./rooms/RoomTemplate";
import Bakery from "./rooms/shops/Bakery";
import BookStore from "./rooms/shops/BookStore";
import Butcher from "./rooms/shops/Butcher";
import Florist from "./rooms/shops/Florist";
import FurnitureStore from "./rooms/shops/FurnitureStore";
import Jeweler from "./rooms/shops/Jeweler";
import ProduceShop1 from "./rooms/shops/ProduceShop1";
import ProduceShop2 from "./rooms/shops/ProduceShop2";
import TailorShop from "./rooms/shops/TailorShop";
import WineShop from "./rooms/shops/WineShop";
import TransformedRoomTemplate from "./rooms/TransformedRoomTemplate";
import ZombieRoomTemplate from "./rooms/ZombieRoomTemplate";

export default class ShopLevel extends LevelTemplate {
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    const rooms: RoomTemplate[] = [];

    const shops: RoomTemplate[] = [];
    shops.push(
      new TransformedRoomTemplate(
        new Bakery(),
        choose(new Matrix(1, 0, 0, 1), new Matrix(-1, 0, 0, 1))
      )
    );
    shops.push(new BookStore());
    shops.push(new Butcher());
    shops.push(new Florist());
    shops.push(new FurnitureStore());
    shops.push(new Jeweler());
    shops.push(new ProduceShop1());
    shops.push(new ProduceShop2());
    shops.push(new TailorShop());
    shops.push(new WineShop());

    const shuffledShops = seededShuffle(shops, seed);
    for (let i = 0; i < 6; i++) {
      rooms.push(shuffledShops[i]);
    }

    const shuffledOrientations = seededShuffle(POSSIBLE_ORIENTATIONS, seed);
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[0]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new BathroomTemplate(),
        shuffledOrientations[1]
      )
    );
    rooms.push(
      new TransformedRoomTemplate(
        new ZombieRoomTemplate(),
        shuffledOrientations[2]
      )
    );

    return rooms;
  }
}
