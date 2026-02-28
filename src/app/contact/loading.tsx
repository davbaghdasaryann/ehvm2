export default function ContactLoading() {
  const iconPositions = [
    "top-[14%] left-[14%]",
    "top-[22%] right-[14%]",
  ];

  return (
    <main className="relative w-full flex-1 flex flex-col items-center h-[calc(100dvh-97px)]">
      <div className="absolute inset-0 pointer-events-none">
        {iconPositions.map((position, idx) => (
          <div
            key={idx}
            className={`ehvm-skeleton absolute ${position} size-[80px] md:size-[100px] rounded-icon shadow-icon`}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        <div className="ehvm-skeleton h-[44px] w-[120px] rounded-pill" />
        <div className="mt-[10px] flex flex-col items-center gap-[6px]">
          <div className="ehvm-skeleton h-[12px] w-[260px] rounded-pill" />
          <div className="ehvm-skeleton h-[12px] w-[220px] rounded-pill" />
        </div>
      </div>

      <div className="relative z-20 flex gap-[15px] items-center mt-[30px]">
        <div className="ehvm-skeleton h-[41px] w-[130px] rounded-pill" />
        <div className="ehvm-skeleton h-[41px] w-[130px] rounded-pill" />
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <div className="ehvm-skeleton h-[41px] w-[120px] rounded-pill" />
      </div>
    </main>
  );
}
