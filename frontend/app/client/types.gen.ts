// This file is auto-generated by @hey-api/openapi-ts

export type BodyLoginLoginAccessToken = {
    grant_type?: string | null;
    username: string;
    password: string;
    scope?: string;
    client_id?: string | null;
    client_secret?: string | null;
};

export type ConferenceCreate = {
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    website_url?: string | null;
    milestones?: Array<ConferenceMilestoneCreate> | null;
};

export type ConferenceMilestoneCreate = {
    name: string;
    date: string;
    time?: string | null;
};

export type ConferenceMilestonePublicReadable = {
    name: string;
    date: string;
    time?: string | null;
    id: string;
    conference_id: string;
    /**
     * Convert date and time to datetime.
     *
     * If time is not provided, it defaults to midnight (00:00).
     */
    readonly as_datetime: string;
};

export type ConferenceMilestonePublicWritable = {
    name: string;
    date: string;
    time?: string | null;
    id: string;
    conference_id: string;
};

export type ConferencePublicReadable = {
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    website_url?: string | null;
    id: string;
    created_at: string;
    updated_at: string;
    created_by_user_id: string;
    tags?: Array<TagPublic>;
    milestones: Array<ConferenceMilestonePublicReadable>;
};

export type ConferencePublicWritable = {
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    website_url?: string | null;
    id: string;
    created_at: string;
    updated_at: string;
    created_by_user_id: string;
    tags?: Array<TagPublic>;
    milestones: Array<ConferenceMilestonePublicWritable>;
};

export type ConferenceUpdate = {
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    website_url?: string | null;
    milestones?: Array<ConferenceMilestoneCreate> | null;
};

export type ConferencesPublicReadable = {
    data: Array<ConferencePublicReadable>;
    count: number;
};

export type ConferencesPublicWritable = {
    data: Array<ConferencePublicWritable>;
    count: number;
};

export type HttpValidationError = {
    detail?: Array<ValidationError>;
};

export type Message = {
    message: string;
};

export type TagCreate = {
    name: string;
    color: string;
};

export type TagPublic = {
    name: string;
    color: string;
    id: string;
    user_id: string;
};

export type TagUpdate = {
    name?: string | null;
    color?: string | null;
};

export type TagsPublic = {
    data: Array<TagPublic>;
    count: number;
};

export type Token = {
    access_token: string;
    token_type?: string;
};

export type UserCreate = {
    username: string;
    is_superuser?: boolean;
    password?: string | null;
};

export type UserPublic = {
    username: string;
    is_superuser?: boolean;
    id: string;
    created_at: string;
    updated_at: string;
};

export type UserRegister = {
    username: string;
    password: string;
};

export type UsersPublic = {
    data: Array<UserPublic>;
    count: number;
};

export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};

export type ConferencesReadConferencesData = {
    body?: never;
    path?: never;
    query?: {
        skip?: number;
        limit?: number;
    };
    url: '/api/v1/conferences/';
};

export type ConferencesReadConferencesErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesReadConferencesError = ConferencesReadConferencesErrors[keyof ConferencesReadConferencesErrors];

export type ConferencesReadConferencesResponses = {
    /**
     * Successful Response
     */
    200: ConferencesPublicReadable;
};

export type ConferencesReadConferencesResponse = ConferencesReadConferencesResponses[keyof ConferencesReadConferencesResponses];

export type ConferencesCreateConferenceData = {
    body: ConferenceCreate;
    path?: never;
    query?: never;
    url: '/api/v1/conferences/';
};

export type ConferencesCreateConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesCreateConferenceError = ConferencesCreateConferenceErrors[keyof ConferencesCreateConferenceErrors];

export type ConferencesCreateConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesCreateConferenceResponse = ConferencesCreateConferenceResponses[keyof ConferencesCreateConferenceResponses];

export type ConferencesDeleteConferenceData = {
    body?: never;
    path: {
        conference_id: string;
    };
    query?: never;
    url: '/api/v1/conferences/{conference_id}';
};

export type ConferencesDeleteConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesDeleteConferenceError = ConferencesDeleteConferenceErrors[keyof ConferencesDeleteConferenceErrors];

export type ConferencesDeleteConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesDeleteConferenceResponse = ConferencesDeleteConferenceResponses[keyof ConferencesDeleteConferenceResponses];

export type ConferencesReadConferenceData = {
    body?: never;
    path: {
        conference_id: string;
    };
    query?: never;
    url: '/api/v1/conferences/{conference_id}';
};

export type ConferencesReadConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesReadConferenceError = ConferencesReadConferenceErrors[keyof ConferencesReadConferenceErrors];

export type ConferencesReadConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesReadConferenceResponse = ConferencesReadConferenceResponses[keyof ConferencesReadConferenceResponses];

export type ConferencesUpdateConferenceData = {
    body: ConferenceUpdate;
    path: {
        conference_id: string;
    };
    query?: never;
    url: '/api/v1/conferences/{conference_id}';
};

export type ConferencesUpdateConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesUpdateConferenceError = ConferencesUpdateConferenceErrors[keyof ConferencesUpdateConferenceErrors];

export type ConferencesUpdateConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesUpdateConferenceResponse = ConferencesUpdateConferenceResponses[keyof ConferencesUpdateConferenceResponses];

export type ConferencesAddTagToConferenceData = {
    body?: never;
    path: {
        conference_id: string;
    };
    query: {
        tag_id: string;
    };
    url: '/api/v1/conferences/{conference_id}/tags';
};

export type ConferencesAddTagToConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesAddTagToConferenceError = ConferencesAddTagToConferenceErrors[keyof ConferencesAddTagToConferenceErrors];

export type ConferencesAddTagToConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesAddTagToConferenceResponse = ConferencesAddTagToConferenceResponses[keyof ConferencesAddTagToConferenceResponses];

export type ConferencesUpdateTagsForConferenceData = {
    body: Array<string>;
    path: {
        conference_id: string;
    };
    query?: never;
    url: '/api/v1/conferences/{conference_id}/tags';
};

export type ConferencesUpdateTagsForConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesUpdateTagsForConferenceError = ConferencesUpdateTagsForConferenceErrors[keyof ConferencesUpdateTagsForConferenceErrors];

export type ConferencesUpdateTagsForConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesUpdateTagsForConferenceResponse = ConferencesUpdateTagsForConferenceResponses[keyof ConferencesUpdateTagsForConferenceResponses];

export type ConferencesRemoveTagFromConferenceData = {
    body?: never;
    path: {
        conference_id: string;
        tag_id: string;
    };
    query?: never;
    url: '/api/v1/conferences/{conference_id}/tags/{tag_id}';
};

export type ConferencesRemoveTagFromConferenceErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ConferencesRemoveTagFromConferenceError = ConferencesRemoveTagFromConferenceErrors[keyof ConferencesRemoveTagFromConferenceErrors];

export type ConferencesRemoveTagFromConferenceResponses = {
    /**
     * Successful Response
     */
    200: ConferencePublicReadable;
};

export type ConferencesRemoveTagFromConferenceResponse = ConferencesRemoveTagFromConferenceResponses[keyof ConferencesRemoveTagFromConferenceResponses];

export type LoginLoginAccessTokenData = {
    body: BodyLoginLoginAccessToken;
    path?: never;
    query?: never;
    url: '/api/v1/login/access-token';
};

export type LoginLoginAccessTokenErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type LoginLoginAccessTokenError = LoginLoginAccessTokenErrors[keyof LoginLoginAccessTokenErrors];

export type LoginLoginAccessTokenResponses = {
    /**
     * Successful Response
     */
    200: Token;
};

export type LoginLoginAccessTokenResponse = LoginLoginAccessTokenResponses[keyof LoginLoginAccessTokenResponses];

export type LoginTestTokenData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/login/test-token';
};

export type LoginTestTokenResponses = {
    /**
     * Successful Response
     */
    200: UserPublic;
};

export type LoginTestTokenResponse = LoginTestTokenResponses[keyof LoginTestTokenResponses];

export type UsersReadUsersData = {
    body?: never;
    path?: never;
    query?: {
        skip?: number;
        limit?: number;
    };
    url: '/api/v1/users/';
};

export type UsersReadUsersErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersReadUsersError = UsersReadUsersErrors[keyof UsersReadUsersErrors];

export type UsersReadUsersResponses = {
    /**
     * Successful Response
     */
    200: UsersPublic;
};

export type UsersReadUsersResponse = UsersReadUsersResponses[keyof UsersReadUsersResponses];

export type UsersCreateUserData = {
    body: UserCreate;
    path?: never;
    query?: never;
    url: '/api/v1/users/';
};

export type UsersCreateUserErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersCreateUserError = UsersCreateUserErrors[keyof UsersCreateUserErrors];

export type UsersCreateUserResponses = {
    /**
     * Successful Response
     */
    200: UserPublic;
};

export type UsersCreateUserResponse = UsersCreateUserResponses[keyof UsersCreateUserResponses];

export type UsersReadUserMeData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/users/me';
};

export type UsersReadUserMeResponses = {
    /**
     * Successful Response
     */
    200: UserPublic;
};

export type UsersReadUserMeResponse = UsersReadUserMeResponses[keyof UsersReadUserMeResponses];

export type UsersRegisterUserData = {
    body: UserRegister;
    path?: never;
    query?: never;
    url: '/api/v1/users/signup';
};

export type UsersRegisterUserErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersRegisterUserError = UsersRegisterUserErrors[keyof UsersRegisterUserErrors];

export type UsersRegisterUserResponses = {
    /**
     * Successful Response
     */
    200: UserPublic;
};

export type UsersRegisterUserResponse = UsersRegisterUserResponses[keyof UsersRegisterUserResponses];

export type UsersDeleteUserData = {
    body?: never;
    path: {
        user_id: string;
    };
    query?: never;
    url: '/api/v1/users/{user_id}';
};

export type UsersDeleteUserErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersDeleteUserError = UsersDeleteUserErrors[keyof UsersDeleteUserErrors];

export type UsersDeleteUserResponses = {
    /**
     * Successful Response
     */
    200: Message;
};

export type UsersDeleteUserResponse = UsersDeleteUserResponses[keyof UsersDeleteUserResponses];

export type UsersReadUserByIdData = {
    body?: never;
    path: {
        user_id: string;
    };
    query?: never;
    url: '/api/v1/users/{user_id}';
};

export type UsersReadUserByIdErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersReadUserByIdError = UsersReadUserByIdErrors[keyof UsersReadUserByIdErrors];

export type UsersReadUserByIdResponses = {
    /**
     * Successful Response
     */
    200: UserPublic;
};

export type UsersReadUserByIdResponse = UsersReadUserByIdResponses[keyof UsersReadUserByIdResponses];

export type TagsReadTagsData = {
    body?: never;
    path?: never;
    query?: {
        skip?: number;
        limit?: number;
        all_users?: boolean;
    };
    url: '/api/v1/tags/';
};

export type TagsReadTagsErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type TagsReadTagsError = TagsReadTagsErrors[keyof TagsReadTagsErrors];

export type TagsReadTagsResponses = {
    /**
     * Successful Response
     */
    200: TagsPublic;
};

export type TagsReadTagsResponse = TagsReadTagsResponses[keyof TagsReadTagsResponses];

export type TagsCreateTagData = {
    body: TagCreate;
    path?: never;
    query?: never;
    url: '/api/v1/tags/';
};

export type TagsCreateTagErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type TagsCreateTagError = TagsCreateTagErrors[keyof TagsCreateTagErrors];

export type TagsCreateTagResponses = {
    /**
     * Successful Response
     */
    200: TagPublic;
};

export type TagsCreateTagResponse = TagsCreateTagResponses[keyof TagsCreateTagResponses];

export type TagsDeleteTagData = {
    body?: never;
    path: {
        tag_id: string;
    };
    query?: never;
    url: '/api/v1/tags/{tag_id}';
};

export type TagsDeleteTagErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type TagsDeleteTagError = TagsDeleteTagErrors[keyof TagsDeleteTagErrors];

export type TagsDeleteTagResponses = {
    /**
     * Successful Response
     */
    200: TagPublic;
};

export type TagsDeleteTagResponse = TagsDeleteTagResponses[keyof TagsDeleteTagResponses];

export type TagsReadTagData = {
    body?: never;
    path: {
        tag_id: string;
    };
    query?: never;
    url: '/api/v1/tags/{tag_id}';
};

export type TagsReadTagErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type TagsReadTagError = TagsReadTagErrors[keyof TagsReadTagErrors];

export type TagsReadTagResponses = {
    /**
     * Successful Response
     */
    200: TagPublic;
};

export type TagsReadTagResponse = TagsReadTagResponses[keyof TagsReadTagResponses];

export type TagsUpdateTagData = {
    body: TagUpdate;
    path: {
        tag_id: string;
    };
    query?: never;
    url: '/api/v1/tags/{tag_id}';
};

export type TagsUpdateTagErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type TagsUpdateTagError = TagsUpdateTagErrors[keyof TagsUpdateTagErrors];

export type TagsUpdateTagResponses = {
    /**
     * Successful Response
     */
    200: TagPublic;
};

export type TagsUpdateTagResponse = TagsUpdateTagResponses[keyof TagsUpdateTagResponses];

export type HealthHealthCheckData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/health/';
};

export type HealthHealthCheckResponses = {
    /**
     * Successful Response
     */
    200: Message;
};

export type HealthHealthCheckResponse = HealthHealthCheckResponses[keyof HealthHealthCheckResponses];

export type ClientOptions = {
    baseUrl: 'http://localhost:8000' | (string & {});
};