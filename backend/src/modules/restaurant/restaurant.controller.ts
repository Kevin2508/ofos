import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetRestaurantsQueryDto, SearchQueryDto, GetGlobalMenuItemsDto } from './dto/restaurant.dto';
import { RestaurantService } from './restaurant.service';

@ApiTags('Restaurants & Discovery')
@Controller()
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('restaurant')
  @ApiOperation({ summary: 'Browse approved restaurants with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of restaurants' })
  async getRestaurants(@Query() query: GetRestaurantsQueryDto) {
    return this.restaurantService.getRestaurants(query);
  }

  @Get('restaurant/featured')
  @ApiOperation({ summary: 'Get featured, top-rated, and trending restaurants' })
  async getFeatured() {
    return this.restaurantService.getFeaturedRestaurants();
  }

  @Get('restaurant/global-menu-items')
  @ApiOperation({ summary: 'Search all menu items across active restaurants' })
  async getGlobalMenuItems(@Query() query: GetGlobalMenuItemsDto) {
    return this.restaurantService.getGlobalMenuItems(query);
  }

  @Get('restaurant/branch/:id')
  @ApiOperation({ summary: 'Get restaurant branch details, hours, and delivery zone' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  async getBranchDetails(@Param('id') id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Branch ID must be numeric');
    }
    return this.restaurantService.getBranchDetails(BigInt(id));
  }

  @Get('restaurant/branch/:id/menu')
  @ApiOperation({ summary: 'Get restaurant branch menu categories and modifier options' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  async getBranchMenu(@Param('id') id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Branch ID must be numeric');
    }
    return this.restaurantService.getBranchMenu(BigInt(id));
  }

  @Get('restaurant/:id')
  @ApiOperation({ summary: 'Get restaurant profile and all branches' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  async getRestaurantDetails(@Param('id') id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Restaurant ID must be numeric');
    }
    return this.restaurantService.getRestaurantById(BigInt(id));
  }

  @Get('restaurant/:id/menu')
  @ApiOperation({ summary: 'Get restaurant menu (primary branch)' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  async getRestaurantMenu(@Param('id') id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Restaurant ID must be numeric');
    }
    return this.restaurantService.getRestaurantMenu(BigInt(id));
  }

  // -------------------------------------------------------------
  // Customer Discovery Endpoints
  // -------------------------------------------------------------
  @Get('customer/feed')
  @ApiOperation({ summary: 'Customer home discovery feed' })
  async getFeed() {
    return this.restaurantService.getFeed();
  }

  @Get('customer/search')
  @ApiOperation({ summary: 'Search restaurants and menu items by keyword' })
  async search(@Query() query: SearchQueryDto) {
    return this.restaurantService.search(query);
  }

  @Get('customer/search/suggestions')
  @ApiOperation({ summary: 'Autocomplete suggestions for search bar' })
  @ApiQuery({ name: 'query', required: true })
  async getSearchSuggestions(@Query('query') query: string) {
    return this.restaurantService.getSearchSuggestions(query || '');
  }
}
