import MapBox from './Components/MapBox';

export default function Home() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <MapBox width="800px" height="550px" />
    </div>
  );
}
