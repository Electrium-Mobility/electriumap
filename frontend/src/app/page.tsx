import Header from "./Components/Header";
import MapBox from "./Components/MapBox";
import AddOutlet from "./Components/AddOutlet";

export default function Home() {
  return <div className="relative w-full h-screen">
    (
    <>
      <Header />
      <MapBox />
    </>
  )
    <AddOutlet />
  </div>;
}