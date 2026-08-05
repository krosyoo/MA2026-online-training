import { SeedSemester } from './types';

export const INITIAL_SEMESTERS: SeedSemester[] = [
  {
    id: 1,
    title: '1학기. 믿음반',
    subtitle: 'Faith Class',
    description: '기초 신앙·초신자·신앙의 기초 확립',
    courses: [
      {
        id: 101,
        title: '신앙의 기초 — 하나님과 구원 이해',
        weeks: 8,
        instructor: '서길원 목사',
        description: '기독교대한감리회 교육국: 신앙기초/입문 강의',
        videoUrl: 'https://www.youtube.com/playlist?list=PLI37YBAmzYVawx7F7n4h-0MHL0zta99Va'
      },
      {
        id: 102,
        title: '예수님과 복음',
        weeks: 6,
        instructor: '유기성 목사',
        description: '교회·목회자 예수 복음 강해 영상',
        videoUrl: 'https://www.youtube.com/watch?v=LqAFofgLyfI'
      },
      {
        id: 103,
        title: '성경 읽기와 QT(큐티) 입문',
        weeks: 8,
        instructor: '서길원 목사',
        description: '성경읽기 입문 공개강의/소그룹 QT 안내',
        videoUrl: 'https://www.youtube.com/shorts/fB3ajPcvHlE'
      },
      {
        id: 104,
        title: '기도(개인기도와 회개) 실습',
        weeks: 6,
        instructor: '김선기 선교사',
        description: '기도 입문·실습 영상',
        videoUrl: 'https://www.youtube.com/watch?v=o7kjATYoPDM'
      }
    ],
    books: {
      lecture: [
        {
          title: '하나님: 성부 하나님의 속성과 사역',
          publisher: 'IVP',
          link: 'https://product.kyobobook.co.kr/detail/S000213962800'
        }
      ],
      required: [
        {
          title: '제자훈련의 터다지기',
          publisher: '규장/교회자료',
          link: 'https://www.woorichurch.org/bwoori/html/sub2012/discipline/sub03.asp'
        }
      ],
      recommended: [
        {
          title: 'IVP 기도 관련 대표서',
          publisher: 'IVP',
          link: 'https://mall.godpeople.com/?G=1274831309-3'
        },
        {
          title: '온가족이 함께 하는 성경관통',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?GO=kj_set'
        },
        {
          title: '초신자용 교재(제자의 삶/기초다지기류)',
          publisher: '교회 실무',
          link: 'https://atlantasiloamchurch.org/%EC%A0%9C%EC%9E%90%ED%95%99%EA%B5%90-%ED%9B%88%EB%A0%A8%EA%B3%BC%EC%A0%95'
        },
        {
          title: '성경 해설 입문서',
          publisher: 'IVP',
          link: 'https://ivp.co.kr/books/book_detail.html?book=s01&idx=1758'
        },
        {
          title: '기도 실천서',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?G=1707136435-1'
        }
      ]
    }
  },
  {
    id: 2,
    title: '2학기. 성장반',
    subtitle: 'Growth Class',
    description: '신앙 성장·신행일치·영성훈련',
    courses: [
      {
        id: 201,
        title: '성령과 성결의 삶',
        weeks: 8,
        instructor: '유기성 목사',
        description: '성령론 강의(교회·신학교 공개강의 영상 모음)',
        videoUrl: 'https://www.youtube.com/watch?v=K7sD4ob9Hcg'
      },
      {
        id: 202,
        title: '성경 깊이읽기(중급) — 구약/신약 핵심 주제',
        weeks: 8,
        instructor: '서길원 목사',
        description: 'IVP·교회 강사 성경 강해 영상 플레이리스트',
        videoUrl: 'https://www.youtube.com/watch?v=QoQ9ozVaz4Q'
      },
      {
        id: 203,
        title: '기도와 영성(중급) — 규칙적 영성훈련',
        weeks: 8,
        instructor: '김선기 선교사',
        description: '규장·교회 영성훈련 강의 영상(새벽기도/묵상법)',
        videoUrl: 'https://www.youtube.com/watch?v=YE0IlqcGuOA'
      },
      {
        id: 204,
        title: '신앙의 실천: 섬김과 봉사',
        weeks: 6,
        instructor: '아크크루',
        description: '감리교 교육국·교회 봉사 훈련 영상 자료',
        videoUrl: 'https://www.youtube.com/watch?v=omITNh_kvR8'
      }
    ],
    books: {
      lecture: [
        {
          title: '성령: 성령 하나님의 속성과 사역',
          publisher: 'IVP',
          link: 'https://product.kyobobook.co.kr/detail/S000213962800'
        }
      ],
      required: [
        {
          title: '성경관통/성경읽기 실천서',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?GO=kj_set'
        }
      ],
      recommended: [
        {
          title: '성경·영성 관련 중급서',
          publisher: 'IVP',
          link: 'https://ivp.co.kr/books/book_detail.html?book=s01&idx=1758'
        },
        {
          title: '영성훈련 관련 도서',
          publisher: '규장',
          link: 'https://www.kyujang.com/'
        },
        {
          title: '새벽기도/기도 실천서',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?G=1707136435-1'
        },
        {
          title: '성경 해석/응용 도서 세트',
          publisher: 'IVP',
          link: 'https://mall.godpeople.com/?G=1274831309-3'
        },
        {
          title: '섬김·실천 관련 교회 실무서',
          publisher: '규장',
          link: 'https://search.kyobobook.co.kr/search?keyword=%EA%B7%9C%EC%9E%A5&pbcmCode=PB18521'
        }
      ]
    }
  },
  {
    id: 3,
    title: '3학기. 제자훈련반',
    subtitle: 'Discipleship Training Class',
    description: '그리스도인 정체성 확립 · 제자화',
    courses: [
      {
        id: 301,
        title: '제자도의 신학적 기초',
        weeks: 10,
        instructor: '아크크루',
        description: '제자훈련 이론·실천 강의',
        videoUrl: 'https://www.youtube.com/watch?v=SLkag2E9Xfs'
      },
      {
        id: 302,
        title: '제자훈련 실습·멤버케어',
        weeks: 10,
        instructor: '김선기 선교사',
        description: '교회 제자훈련 사례 영상',
        videoUrl: 'https://www.youtube.com/watch?v=r2XIamNZ114'
      },
      {
        id: 303,
        title: '삶으로의 제자화 — 직장·가정 제자훈련',
        weeks: 8,
        instructor: '서길원 목사',
        description: '목회자 사례 강의',
        videoUrl: 'https://www.youtube.com/watch?v=JTJTCPwzhRI'
      },
      {
        id: 304,
        title: '전도와 선교적 삶',
        weeks: 6,
        instructor: '유기성 목사',
        description: '감리교 선교·전도 교육 영상',
        videoUrl: 'https://www.youtube.com/watch?v=CNmXxILlp30'
      }
    ],
    books: {
      lecture: [
        {
          title: '제자훈련의 터다지기 / 제자훈련 실전교재',
          publisher: '규장/교회 자체 발행',
          link: 'https://www.woorichurch.org/bwoori/html/sub2012/discipline/sub03.asp'
        }
      ],
      required: [
        {
          title: '제자도/제자훈련 입문서',
          publisher: 'IVP 또는 규장',
          link: 'https://ivp.co.kr'
        }
      ],
      recommended: [
        {
          title: '제자도·제자훈련 관련 지정도서',
          publisher: 'IVP',
          link: 'https://ivp.co.kr'
        },
        {
          title: '제자훈련 사례집',
          publisher: '규장',
          link: 'https://search.kyobobook.co.kr/search?keyword=%EA%B7%9C%EC%9E%A5&pbcmCode=PB18521'
        },
        {
          title: '멘토링·양육 실무서',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?GO=kj_set'
        },
        {
          title: '소그룹·리더십·양육 관련 도서 세트',
          publisher: 'IVP',
          link: 'https://mall.godpeople.com/?G=1274831309-3'
        },
        {
          title: '전도·선교 실천서',
          publisher: '규장',
          link: 'https://www.kyujang.com/'
        }
      ]
    }
  },
  {
    id: 4,
    title: '4학기. 리더반',
    subtitle: 'Leader Class',
    description: '교회·소그룹·목회 리더 양성',
    courses: [
      {
        id: 401,
        title: '영적리더십 — 목회자/평신도 리더십 원리',
        weeks: 10,
        instructor: '유기성 목사',
        description: '감리회·교회·신학교 리더십 강의',
        videoUrl: 'https://www.youtube.com/watch?v=R1ByQVG1jP0'
      },
      {
        id: 402,
        title: '셀리더 지침서',
        weeks: 8,
        instructor: '김선기 선교사',
        description: '청년교구 행정·운영 강의',
        videoUrl: 'https://www.youtube.com/watch?v=41mN9D6sj-w'
      },
      {
        id: 403,
        title: '나눔과 제자훈련 리딩',
        weeks: 10,
        instructor: '서길원 목사',
        description: '나눔, 제자훈련법 강의',
        videoUrl: 'https://www.youtube.com/playlist?list=PLXmYgvea7T2t_unaH2w6iW0r1sJ8s_s-C'
      },
      {
        id: 404,
        title: '윤리·영성관리',
        weeks: 6,
        instructor: '아크크루',
        description: '리더 영성관리·윤리 강의',
        videoUrl: 'https://www.youtube.com/playlist?list=PLOG59PQmLXWiMOGsTGQODkHX5OXLtRIDa'
      }
    ],
    books: {
      lecture: [
        {
          title: '리더십·목회사역 관련 대표서',
          publisher: 'IVP 또는 규장',
          link: 'https://ivp.co.kr'
        }
      ],
      required: [
        {
          title: '교회운영·목회실무 필독서',
          publisher: '규장',
          link: 'https://www.kyujang.com/'
        }
      ],
      recommended: [
        {
          title: '목회·설교·리더십 관련 도서',
          publisher: 'IVP',
          link: 'https://ivp.co.kr'
        },
        {
          title: '리더 훈련·목회 실무서',
          publisher: '규장',
          link: 'https://search.kyobobook.co.kr/search?keyword=%EA%B7%9C%EC%9E%A5&pbcmCode=PB18521'
        },
        {
          title: '영성관리/목회자 기도서',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?G=1707136435-1'
        },
        {
          title: '교회론·공동체 신학서',
          publisher: 'IVP',
          link: 'https://ivp.co.kr'
        },
        {
          title: '소그룹·제자훈련 심화서',
          publisher: '규장',
          link: 'https://mall.godpeople.com/?GO=kj_set'
        }
      ]
    }
  }
];
