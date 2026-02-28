export default function LoadingAppDetail() {
  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="bg-card flex flex-col gap-[20px] items-start p-[15px] rounded-card w-full max-w-[500px]">
        <div className="flex gap-[10px] items-center w-full">
          <div className="ehvm-skeleton relative shrink-0 size-[100px] rounded-icon" />
          <div className="flex flex-[1_0_0] flex-col gap-[8px] w-full">
            <div className="ehvm-skeleton h-[22px] w-[60%] rounded-pill" />
            <div className="ehvm-skeleton h-[14px] w-[40%] rounded-pill" />
            <div className="flex gap-[5px] pt-[6px] flex-wrap">
              <div className="ehvm-skeleton h-[27px] w-[96px] rounded-pill" />
              <div className="ehvm-skeleton h-[27px] w-[72px] rounded-pill" />
              <div className="ehvm-skeleton h-[27px] w-[118px] rounded-pill" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[10px] w-full">
          <div className="ehvm-skeleton h-[20px] w-[90px] rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-full rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-[88%] rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-[72%] rounded-pill" />
        </div>

        <div className="flex gap-[10px] flex-wrap">
          <div className="ehvm-skeleton h-[41px] w-[132px] rounded-pill" />
          <div className="ehvm-skeleton h-[41px] w-[132px] rounded-pill" />
        </div>

        <div className="ehvm-skeleton w-full aspect-[1592/820] rounded-icon" />

        <div className="flex flex-col gap-[10px] w-full">
          <div className="ehvm-skeleton h-[20px] w-[120px] rounded-pill" />
          <div className="ehvm-skeleton h-[75px] w-full rounded-icon" />
          <div className="ehvm-skeleton h-[75px] w-full rounded-icon" />
        </div>

        <div className="ehvm-skeleton w-full h-[330px] rounded-icon" />
      </div>
    </main>
  );
}
