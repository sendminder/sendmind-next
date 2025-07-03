'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

interface SearchParams {
  신고가구분: string;
  검색시작년월일: string;
  검색종료년월일: string;
  법정동코드: string;
  건물유형구분: string;
  거래구분: string;
  최소금액: string;
  최대금액: string;
  페이지목록수: string;
  페이지번호: string;
  정렬구분: string;
  법정동레벨: string;
  최소전용면적: string;
  최대전용면적: string;
}

interface SearchResult {
  순위: number;
  단지명: string;
  지역명: string;
  전용면적: string;
  거래금액: number;
  거래년월일: string;
  거래층: string;
  직전거래금액: number;
  직전거래년월일: string;
  직전거래층: string;
  변동가격: number;
  변동률: number;
  번지: string;
  공급면적타입: string;
  전용평형: number;
}

interface LegalDongCode {
  code: string;
  name: string;
  fullName: string;
}

export default function Home() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    신고가구분: '05',
    검색시작년월일: '20250628',
    검색종료년월일: '20250628',
    법정동코드: '4113510900',
    건물유형구분: '01',
    거래구분: '01',
    최소금액: '-1',
    최대금액: '-1',
    페이지목록수: '20',
    페이지번호: '1',
    정렬구분: 'MD',
    법정동레벨: '01',
    최소전용면적: '56',
    최대전용면적: '90'
  });
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateDate, setUpdateDate] = useState<string>('');
  const [totalSize, setTotalSize] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]); // 최대 50억으로 변경
  const [dongSearchTerm, setDongSearchTerm] = useState<string>('');
  const [dongSearchResults, setDongSearchResults] = useState<LegalDongCode[]>([]);
  const [showDongSearch, setShowDongSearch] = useState<boolean>(false);
  const [dongCodes, setDongCodes] = useState<LegalDongCode[]>([]);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}${mm}${dd}`;

  const handleSearch = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const searchParamsWithPage = {
        ...searchParams,
        페이지번호: page.toString()
      };
      
      Object.entries(searchParamsWithPage).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`https://api.kbland.kr/land-extra/hub/v1/api/rank/upDownPriceList?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      
      // 실제 API 응답 구조에 맞게 데이터 매핑 (단일 객체)
      if (data?.dataBody?.data?.list) {
        const list = data.dataBody.data.list;
        const size = data.dataBody.data.size || 0;
        const pageSize = parseInt(searchParams.페이지목록수);
        
        setUpdateDate(data.dataBody.data.업데이트일자 || '');
        setTotalSize(size);
        setCurrentPage(page);
        setTotalPages(Math.ceil(size / pageSize));
        
        setResults(list.map((item: SearchResult) => ({
          순위: item.순위 || 0,
          단지명: item.단지명 || '',
          지역명: item.지역명 || '',
          전용면적: item.전용면적 || '',
          거래금액: item.거래금액 || 0,
          거래년월일: item.거래년월일 || '',
          거래층: item.거래층 || '',
          직전거래금액: item.직전거래금액 || 0,
          직전거래년월일: item.직전거래년월일 || '',
          직전거래층: item.직전거래층 || '',
          변동가격: item.변동가격 || 0,
          변동률: item.변동률 || 0,
          번지: item.번지 || '',
          공급면적타입: item.공급면적타입 || '',
          전용평형: item.전용평형 || 0
        })));
      } else {
        setResults([]);
        setUpdateDate('');
        setTotalSize(0);
        setCurrentPage(1);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setResults([]);
      setUpdateDate('');
      setTotalSize(0);
      setCurrentPage(1);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      handleSearch(page);
    }
  };

  // 슬라이더 값 변경 처리
  const handlePriceRangeChange = (values: [number, number]) => {
    setPriceRange(values);
    
    // 슬라이더 값을 searchParams에 반영 (억 단위를 만원 단위로 변환)
    const minPrice = values[0] === 0 ? '-1' : (values[0] * 10000).toString();
    const maxPrice = values[1] === 50 ? '-1' : (values[1] * 10000).toString();
    
    setSearchParams(prev => ({
      ...prev,
      최소금액: minPrice,
      최대금액: maxPrice
    }));
  };

  // searchParams 변경 시 슬라이더 값 동기화
  const syncPriceRangeWithParams = () => {
    const minPrice = searchParams.최소금액 === '-1' ? 0 : Math.floor(parseInt(searchParams.최소금액) / 10000) || 0;
    const maxPrice = searchParams.최대금액 === '-1' ? 50 : Math.floor(parseInt(searchParams.최대금액) / 10000) || 50;
    setPriceRange([minPrice, maxPrice]);
  };

  // 컴포넌트 마운트 시 슬라이더 값 동기화
  useEffect(() => {
    syncPriceRangeWithParams();
  }, [syncPriceRangeWithParams]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dong-search-container')) {
        setShowDongSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // CSV 로드 useEffect 추가
  useEffect(() => {
    fetch('/location-code.csv')
      .then(res => res.text())
      .then(text => {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data as Record<string, string>[];
        const codes = rows
          .filter((row) => row['폐지여부'] === '존재')
          .map((row) => ({
            code: row['법정동코드'],
            name: row['법정동명']?.split(' ').pop() || row['법정동명'],
            fullName: row['법정동명'],
          }));
        setDongCodes(codes);
      });
  }, []);

  // 법정동코드 검색 함수
  const searchDongCode = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setDongSearchResults([]);
      return;
    }
    const filtered = dongCodes.filter(dong =>
      dong.name.includes(searchTerm) ||
      dong.fullName.includes(searchTerm)
    ).slice(0, 10);
    setDongSearchResults(filtered);
  };

  // 법정동코드 선택 함수
  const selectDongCode = (dongCode: LegalDongCode) => {
    setSearchParams(prev => ({
      ...prev,
      법정동코드: dongCode.code
    }));
    setDongSearchTerm(dongCode.fullName);
    setShowDongSearch(false);
    setDongSearchResults([]);
  };

  const updateSearchParam = (key: keyof SearchParams, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 예시 데이터 로드 함수
  const loadExampleData = () => {
    setSearchParams({
      신고가구분: '05',
      검색시작년월일: todayStr,
      검색종료년월일: todayStr,
      법정동코드: '1171010100',
      건물유형구분: '01',
      거래구분: '01',
      최소금액: '-1',
      최대금액: '-1',
      페이지목록수: '20',
      페이지번호: '1',
      정렬구분: 'MD',
      법정동레벨: '01',
      최소전용면적: '56',
      최대전용면적: '90'
    });
  };

  // 금액 포맷팅 함수 (억 단위)
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      const billion = price / 10000;
      return `${billion.toFixed(1)}억`;
    } else {
      return `${price.toLocaleString()}만원`;
    }
  };

  // 변동률 색상 결정
  const getChangeColor = (changeRate: number) => {
    if (changeRate > 0) return 'text-red-600';
    if (changeRate < 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  // 변동률 화살표
  const getChangeArrow = (changeRate: number) => {
    if (changeRate > 0) return '↗';
    if (changeRate < 0) return '↘';
    return '→';
  };

  // 네이버 지도 링크 생성
  const getNaverMapLink = (complexName: string, regionName: string) => {
    const searchQuery = encodeURIComponent(`${complexName} ${regionName}`);
    return `https://map.naver.com/p/search/${searchQuery}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          KB부동산 실거래 검색
        </h1>
        
        {/* 검색 파라미터 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">검색 조건</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 날짜 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">검색 시작일</label>
              <input
                type="date"
                value={searchParams.검색시작년월일 ? `${searchParams.검색시작년월일.slice(0, 4)}-${searchParams.검색시작년월일.slice(4, 6)}-${searchParams.검색시작년월일.slice(6, 8)}` : ''}
                onChange={(e) => {
                  const date = e.target.value.replace(/-/g, '');
                  updateSearchParam('검색시작년월일', date);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">검색 종료일</label>
              <input
                type="date"
                value={searchParams.검색종료년월일 ? `${searchParams.검색종료년월일.slice(0, 4)}-${searchParams.검색종료년월일.slice(4, 6)}-${searchParams.검색종료년월일.slice(6, 8)}` : ''}
                onChange={(e) => {
                  const date = e.target.value.replace(/-/g, '');
                  updateSearchParam('검색종료년월일', date);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 법정동코드 */}
            <div className="relative dong-search-container">
              <label className="block text-sm font-medium text-gray-700 mb-1">법정동코드</label>
              <div className="relative">
                <input
                  type="text"
                  value={dongSearchTerm}
                  onChange={(e) => {
                    setDongSearchTerm(e.target.value);
                    searchDongCode(e.target.value);
                    setShowDongSearch(true);
                  }}
                  onFocus={() => setShowDongSearch(true)}
                  placeholder="잠실동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* 검색 결과 드롭다운 */}
                {showDongSearch && dongSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {dongSearchResults.map((dong, index) => (
                      <div
                        key={index}
                        onClick={() => selectDongCode(dong)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{dong.fullName}</div>
                        <div className="text-sm text-gray-500">코드: {dong.code}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 현재 선택된 법정동코드 표시 */}
                {searchParams.법정동코드 && (
                  <div className="mt-1 text-xs text-gray-500">
                    선택된 코드: {searchParams.법정동코드}
                  </div>
                )}
              </div>
            </div>

            {/* 금액 범위 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">금액 범위 (억원)</label>
              <div className="space-y-4">
                {/* 최소값 슬라이더 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">최소 금액</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      const newMax = Math.max(newMin, priceRange[1]);
                      handlePriceRangeChange([newMin, newMax]);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-1">
                    <span className="text-sm font-medium text-gray-900">
                      {priceRange[0] === 0 ? '제한없음' : `${priceRange[0]}억원`}
                    </span>
                  </div>
                </div>

                {/* 최대값 슬라이더 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">최대 금액</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const newMin = Math.min(priceRange[0], newMax);
                      handlePriceRangeChange([newMin, newMax]);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-1">
                    <span className="text-sm font-medium text-gray-900">
                      {priceRange[1] === 50 ? '제한없음' : `${priceRange[1]}억원`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 면적 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최소전용면적 (㎡)</label>
              <input
                type="number"
                value={searchParams.최소전용면적}
                onChange={(e) => updateSearchParam('최소전용면적', e.target.value)}
                placeholder="예: 56"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최대전용면적 (㎡)</label>
              <input
                type="number"
                value={searchParams.최대전용면적}
                onChange={(e) => updateSearchParam('최대전용면적', e.target.value)}
                placeholder="예: 90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 선택 옵션들 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">건물유형구분</label>
              <select
                value={searchParams.건물유형구분}
                onChange={(e) => updateSearchParam('건물유형구분', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="01">아파트</option>
                <option value="02">오피스텔</option>
                <option value="03">빌라</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">거래구분</label>
              <select
                value={searchParams.거래구분}
                onChange={(e) => updateSearchParam('거래구분', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="01">매매</option>
                <option value="02">전세</option>
                <option value="03">월세</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬구분</label>
              <select
                value={searchParams.정렬구분}
                onChange={(e) => updateSearchParam('정렬구분', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MD">매매일자순</option>
                <option value="PR">가격순</option>
                <option value="AR">면적순</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">페이지목록수</label>
              <select
                value={searchParams.페이지목록수}
                onChange={(e) => updateSearchParam('페이지목록수', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="10">10개</option>
                <option value="20">20개</option>
                <option value="50">50개</option>
                <option value="100">100개</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? '검색 중...' : '실거래 검색'}
            </button>
          </div>
        </div>

        {/* 결과 표시 섹션 */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">검색 결과 ({totalSize}건)</h2>
              {updateDate && (
                <span className="text-sm text-gray-500">업데이트: {updateDate}</span>
              )}
            </div>
            {/* 데스크탑/태블릿: 테이블 */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left text-sm font-medium">순위</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">단지명</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">지역명</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">전용면적</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">거래금액</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">거래일자</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">거래층</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">직전거래</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">변동</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">번지</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {result.순위}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{result.단지명}</span>
                          <a
                            href={getNaverMapLink(result.단지명, result.지역명)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="네이버 지도에서 보기"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </a>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">{result.지역명}</td>
                      <td className="px-3 py-3 text-sm">
                        {result.전용면적}㎡ ({result.전용평형}평)
                      </td>
                      <td className="px-3 py-3 font-semibold text-green-600">
                        {formatPrice(result.거래금액)}
                      </td>
                      <td className="px-3 py-3 text-sm">{result.거래년월일}</td>
                      <td className="px-3 py-3 text-sm">{result.거래층}층</td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {result.직전거래금액 > 0 ? (
                          <div>
                            <div>{formatPrice(result.직전거래금액)}</div>
                            <div className="text-xs">{result.직전거래년월일}</div>
                            {result.직전거래층 && <div className="text-xs">{result.직전거래층}층</div>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <div className={`font-medium ${getChangeColor(result.변동률)}`}>
                          <span className="mr-1">{getChangeArrow(result.변동률)}</span>
                          {result.변동가격 > 0 ? '+' : ''}{formatPrice(result.변동가격)}
                        </div>
                        <div className={`text-xs ${getChangeColor(result.변동률)}`}>
                          {result.변동률 > 0 ? '+' : ''}{result.변동률.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">{result.번지}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 모바일: 카드형 리스트 */}
            <div className="block md:hidden space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4 shadow flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-blue-700">{result.단지명}</span>
                    <span className="text-xs text-gray-500">{result.순위}위</span>
                  </div>
                  <div className="text-sm text-gray-700">{result.지역명} | {result.전용면적}㎡ ({result.전용평형}평)</div>
                  <div className="text-green-700 font-semibold">거래금액: {formatPrice(result.거래금액)}</div>
                  <div className="text-xs text-gray-500">거래일자: {result.거래년월일} / {result.거래층}층</div>
                  {result.직전거래금액 > 0 && (
                    <div className="text-xs text-gray-500">직전거래: {formatPrice(result.직전거래금액)} ({result.직전거래년월일}, {result.직전거래층}층)</div>
                  )}
                  <div className="flex gap-2 text-xs">
                    <span className={`font-medium ${getChangeColor(result.변동률)}`}>{getChangeArrow(result.변동률)} {result.변동가격 > 0 ? '+' : ''}{formatPrice(result.변동가격)}</span>
                    <span className={`font-medium ${getChangeColor(result.변동률)}`}>{result.변동률 > 0 ? '+' : ''}{result.변동률.toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-gray-400">번지: {result.번지}</div>
                </div>
              ))}
            </div>
            {/* 페이지네이션, 페이지 정보 등은 기존대로 유지 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex items-center space-x-2">
                  {/* 이전 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  {/* 페이지 번호들 */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {/* 다음 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                {currentPage} / {totalPages} 페이지 (총 {totalSize}건)
              </div>
            )}
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            검색 조건을 입력하고 검색 버튼을 클릭하거나, &quot;예시 데이터 로드&quot; 버튼을 클릭하여 테스트해보세요.
          </div>
        )}
      </div>
    </div>
  );
}
