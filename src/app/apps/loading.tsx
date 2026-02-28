export default function AppsLoading() {
  return (
    <main className="w-full flex flex-col items-center px-[10px] pb-[40px]">
      <div className="w-full max-w-[1180px]">
        <div className="flex gap-[10px] justify-center">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="ehvm-skeleton h-[41px] w-[110px] rounded-pill" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-[1180px] flex flex-wrap gap-[10px] justify-center mt-[18px]">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-card flex rounded-card p-[15px] w-full max-w-[382px] min-w-[335px]">
            <div className="flex flex-1 gap-[10px] items-center min-w-0">
              <div className="ehvm-skeleton size-[100px] rounded-icon shrink-0" />
              <div className="flex flex-1 flex-col gap-[8px] min-h-[100px] min-w-0 overflow-hidden">
                <div className="ehvm-skeleton h-[22px] w-[72%] max-w-full rounded-pill shrink-0" />
                <div className="ehvm-skeleton h-[14px] w-[52%] max-w-full rounded-pill shrink-0" />
                <div className="flex gap-[5px] pt-[4px] flex-wrap min-w-0">
                  <div className="ehvm-skeleton h-[27px] min-w-0 max-w-[128px] w-[95px] rounded-pill" />
                  <div className="ehvm-skeleton h-[27px] min-w-0 max-w-[132px] w-[110px] rounded-pill" />
                  <div className="ehvm-skeleton h-[27px] min-w-0 max-w-[84px] w-[70px] rounded-pill" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
